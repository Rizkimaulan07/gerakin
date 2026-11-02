import { createHash, randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { mapUser, pool } from './db.mjs'

const scrypt = promisify(scryptCallback)
const sessionDurationMs = 30 * 24 * 60 * 60 * 1000

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex')
}

async function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const derivedKey = await scrypt(password, salt, 64)
  return `${salt}:${derivedKey.toString('hex')}`
}

async function verifyPassword(password, storedHash) {
  if (!storedHash) {
    await hashPassword(password, 'gerakin-invalid-account')
    return false
  }

  const [salt, expectedHex] = storedHash.split(':')
  if (!salt || !expectedHex) return false

  const actual = await scrypt(password, salt, 64)
  const expected = Buffer.from(expectedHex, 'hex')
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

export async function registerAccount({ email, name, password }) {
  const id = `u-${randomUUID()}`
  const usernameBase =
    name
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '')
      .slice(0, 20) || 'gerakin'
  const username = `${usernameBase}-${randomUUID().slice(0, 8)}`
  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const passwordHash = await hashPassword(password)

  const result = await pool.query(
    `insert into users (id, name, username, initials, email, password_hash)
     values ($1, $2, $3, $4, $5, $6)
     returning *`,
    [id, name, username, initials, email, passwordHash],
  )

  return mapUser(result.rows[0])
}

export async function authenticateAccount(email, password) {
  const result = await pool.query(
    'select id, password_hash from users where lower(email) = $1',
    [email],
  )
  const account = result.rows[0]
  if (!(await verifyPassword(password, account?.password_hash))) return null

  const userResult = await pool.query('select * from users where id = $1', [account.id])
  return userResult.rows[0] ? mapUser(userResult.rows[0]) : null
}

export async function createSession(userId) {
  const token = randomBytes(32).toString('base64url')
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + sessionDurationMs)

  await pool.query('delete from auth_sessions where expires_at <= now()')
  await pool.query(
    'insert into auth_sessions (token_hash, user_id, expires_at) values ($1, $2, $3)',
    [tokenHash, userId, expiresAt],
  )
  return { token, expiresAt }
}

export async function findSessionUser(token) {
  if (!token) return null
  const result = await pool.query(
    `select u.*
     from auth_sessions s
     join users u on u.id = s.user_id
     where s.token_hash = $1 and s.expires_at > now()`,
    [hashToken(token)],
  )
  return result.rows[0] ? mapUser(result.rows[0]) : null
}

export async function deleteSession(token) {
  if (!token) return
  await pool.query('delete from auth_sessions where token_hash = $1', [hashToken(token)])
}

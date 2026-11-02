import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  authenticateAccount,
  createSession,
  deleteSession,
  findSessionUser,
  registerAccount,
} from './auth.mjs'
import {
  checkHealth,
  countActivityKudos,
  countChallengeParticipants,
  countClubMembers,
  findUser,
  getActivities,
  getActivity,
  getBootstrap,
  mapUser,
  pool,
} from './db.mjs'

const app = express()
const port = Number(process.env.PORT || 3001)
const sports = new Set(['run', 'ride', 'walk', 'hike', 'swim', 'gym', 'football', 'yoga'])
const sessionCookieName = 'gerakin_session'

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN
      ? process.env.CLIENT_ORIGIN.split(',').map((value) => value.trim())
      : true,
    credentials: true,
  }),
)
app.use(express.json({ limit: '1mb' }))

function text(value, fallback = '', maxLength = 500) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : fallback
}

function number(value, fallback = 0, min = 0, max = Number.MAX_SAFE_INTEGER) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(max, Math.max(min, parsed))
}

function initialsOf(name) {
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function asyncRoute(handler) {
  return (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next)
  }
}

function getSessionToken(request) {
  const cookies = request.headers.cookie?.split(';') ?? []
  const sessionCookie = cookies.find((cookie) =>
    cookie.trim().startsWith(`${sessionCookieName}=`),
  )
  return sessionCookie?.trim().slice(sessionCookieName.length + 1) ?? ''
}

function setSessionCookie(response, token, maxAgeSeconds = 30 * 24 * 60 * 60) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  response.setHeader(
    'Set-Cookie',
    `${sessionCookieName}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAgeSeconds}${secure}`,
  )
}

app.post('/api/auth/register', asyncRoute(async (request, response) => {
  const email = text(request.body?.email, '', 254).toLowerCase()
  const name = text(request.body?.name, '', 100)
  const password = typeof request.body?.password === 'string' ? request.body.password : ''

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    response.status(400).json({ error: 'Masukkan alamat email yang valid.' })
    return
  }
  if (name.length < 2) {
    response.status(400).json({ error: 'Nama minimal 2 karakter.' })
    return
  }
  if (password.length < 8 || password.length > 128) {
    response.status(400).json({ error: 'Kata sandi harus terdiri dari 8–128 karakter.' })
    return
  }

  try {
    const user = await registerAccount({ email, name, password })
    const session = await createSession(user.id)
    setSessionCookie(response, session.token)
    response.status(201).json({ user })
  } catch (error) {
    if (error.code === '23505') {
      response.status(409).json({ error: 'Email ini sudah terdaftar. Silakan masuk.' })
      return
    }
    throw error
  }
}))

app.post('/api/auth/login', asyncRoute(async (request, response) => {
  const email = text(request.body?.email, '', 254).toLowerCase()
  const password = typeof request.body?.password === 'string' ? request.body.password : ''

  if (!email || !password) {
    response.status(400).json({ error: 'Email dan kata sandi wajib diisi.' })
    return
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length > 128) {
    response.status(400).json({ error: 'Email atau kata sandi tidak valid.' })
    return
  }

  const user = await authenticateAccount(email, password)
  if (!user) {
    response.status(401).json({ error: 'Email atau kata sandi tidak cocok.' })
    return
  }

  const session = await createSession(user.id)
  setSessionCookie(response, session.token)
  response.json({ user })
}))

app.get('/api/auth/session', asyncRoute(async (request, response) => {
  const user = await findSessionUser(getSessionToken(request))
  response.json({ user })
}))

app.post('/api/auth/logout', asyncRoute(async (request, response) => {
  await deleteSession(getSessionToken(request))
  setSessionCookie(response, '', 0)
  response.json({ ok: true })
}))

app.get('/api/health', asyncRoute(async (_request, response) => {
  const time = await checkHealth()
  response.json({ ok: true, database: 'connected', time })
}))

app.use('/api', asyncRoute(async (request, response, next) => {
  if (request.path === '/health' || request.path.startsWith('/auth/')) {
    next()
    return
  }

  const user = await findSessionUser(getSessionToken(request))
  if (!user) {
    response.status(401).json({ error: 'Silakan masuk untuk melanjutkan.' })
    return
  }

  request.user = user
  next()
}))

app.get('/api/bootstrap', asyncRoute(async (request, response) => {
  const userId = request.user.id
  const data = await getBootstrap(userId)

  if (!data) {
    response.status(404).json({ error: 'Pengguna tidak ditemukan' })
    return
  }

  response.json(data)
}))

app.get('/api/activities', asyncRoute(async (_request, response) => {
  const activities = await getActivities()
  response.json({ activities })
}))

app.get('/api/activities/:id', asyncRoute(async (request, response) => {
  const activity = await getActivity(request.params.id)
  if (!activity) {
    response.status(404).json({ error: 'Aktivitas tidak ditemukan' })
    return
  }

  response.json({ activity })
}))

app.post('/api/activities', asyncRoute(async (request, response) => {
  const body = request.body ?? {}
  const userId = request.user.id
  const sport = text(body.sport, '', 20)
  const user = request.user
  if (!sports.has(sport)) {
    response.status(400).json({ error: 'Jenis olahraga tidak didukung' })
    return
  }

  const title = text(body.title, '', 160) || `Aktivitas ${sport}`
  const location = text(body.location, user.city, 160)
  const description = text(body.description, '', 2000)
  const route = Array.isArray(body.route)
    ? body.route
        .filter(
          (point) =>
            point &&
            Number.isFinite(Number(point.lat)) &&
            Number.isFinite(Number(point.lng)),
        )
        .slice(0, 20000)
        .map((point) => ({ lat: Number(point.lat), lng: Number(point.lng) }))
    : []
  const date = new Date(body.date)
  const id = text(body.id, `act-${randomUUID()}`, 80)
  const distanceM = number(body.distanceM, 0, 0, 2_000_000)
  const durationS = Math.round(number(body.durationS, 0, 0, 2_000_000))
  const elevationM = number(body.elevationM, 0, 0, 100_000)
  const calories = Math.round(number(body.calories, 0, 0, 100_000))
  const avgHeartRate = body.avgHeartRate
    ? Math.round(number(body.avgHeartRate, 0, 20, 260))
    : null

  if (durationS <= 0) {
    response.status(400).json({ error: 'Durasi aktivitas harus lebih dari 0 detik' })
    return
  }

  const result = await pool.query(
    `insert into activities
      (id, user_id, sport, title, description, date, distance_m, duration_s, elevation_m,
       calories, avg_heart_rate, route, location, is_manual)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
     returning id`,
    [
      id,
      userId,
      sport,
      title,
      description,
      Number.isNaN(date.getTime()) ? new Date() : date,
      distanceM,
      durationS,
      elevationM,
      calories,
      avgHeartRate,
      JSON.stringify(route),
      location,
      Boolean(body.isManual ?? route.length === 0),
    ],
  )

  const activity = await getActivity(result.rows[0].id)
  response.status(201).json({ activity })
}))

app.delete('/api/activities/:id', asyncRoute(async (request, response) => {
  const userId = request.user.id
  const existing = await pool.query('select user_id from activities where id = $1', [
    request.params.id,
  ])

  if (!existing.rows[0]) {
    response.status(404).json({ error: 'Aktivitas tidak ditemukan' })
    return
  }
  if (existing.rows[0].user_id !== userId) {
    response.status(403).json({ error: 'Kamu hanya bisa menghapus aktivitas sendiri' })
    return
  }

  await pool.query('delete from activities where id = $1', [request.params.id])
  response.json({ ok: true })
}))

app.post('/api/activities/:id/kudos', asyncRoute(async (request, response) => {
  const userId = request.user.id

  const activity = await pool.query('select 1 from activities where id = $1', [request.params.id])
  if (!activity.rows[0]) {
    response.status(404).json({ error: 'Aktivitas tidak ditemukan' })
    return
  }

  const existing = await pool.query(
    'select 1 from activity_kudos where activity_id = $1 and user_id = $2',
    [request.params.id, userId],
  )

  if (existing.rows[0]) {
    await pool.query('delete from activity_kudos where activity_id = $1 and user_id = $2', [
      request.params.id,
      userId,
    ])
  } else {
    await pool.query('insert into activity_kudos (activity_id, user_id) values ($1, $2)', [
      request.params.id,
      userId,
    ])
  }

  const kudos = await countActivityKudos(request.params.id)
  response.json({ given: !existing.rows[0], kudos })
}))

app.post('/api/activities/:id/comments', asyncRoute(async (request, response) => {
  const userId = request.user.id
  const body = text(request.body?.text, '', 600)
  const user = request.user
  if (!body) {
    response.status(400).json({ error: 'Komentar tidak boleh kosong' })
    return
  }

  const activity = await pool.query('select 1 from activities where id = $1', [request.params.id])
  if (!activity.rows[0]) {
    response.status(404).json({ error: 'Aktivitas tidak ditemukan' })
    return
  }

  const id = `c-${randomUUID()}`
  const result = await pool.query(
    `insert into activity_comments (id, activity_id, user_id, body)
     values ($1, $2, $3, $4)
     returning id, body, created_at`,
    [id, request.params.id, userId, body],
  )

  response.status(201).json({
    comment: {
      id: result.rows[0].id,
      userId: user.id,
      name: user.name,
      initials: user.initials,
      color: user.color,
      text: result.rows[0].body,
      createdAt: result.rows[0].created_at,
    },
  })
}))

app.patch('/api/users/:id', asyncRoute(async (request, response) => {
  const user = request.user
  if (request.params.id !== user.id) {
    response.status(403).json({ error: 'Kamu hanya bisa mengubah profil sendiri.' })
    return
  }

  const name = text(request.body?.name, user.name, 100)
  const bio = text(request.body?.bio, user.bio, 500)
  const city = text(request.body?.city, user.city, 100)
  const weeklyGoalKm = Math.round(
    number(request.body?.weeklyGoalKm, user.weeklyGoalKm, 1, 1000),
  )

  if (!name) {
    response.status(400).json({ error: 'Nama tidak boleh kosong' })
    return
  }

  const result = await pool.query(
    `update users
     set name = $1, bio = $2, city = $3, weekly_goal_km = $4, initials = $5
     where id = $6
     returning *`,
    [name, bio, city, weeklyGoalKm, initialsOf(name), user.id],
  )

  response.json({ user: mapUser(result.rows[0]) })
}))

app.post('/api/users/:id/follow', asyncRoute(async (request, response) => {
  const followerId = request.user.id
  const followingId = request.params.id

  if (followerId === followingId) {
    response.status(400).json({ error: 'Tidak bisa mengikuti diri sendiri' })
    return
  }
  if (!(await findUser(followingId))) {
    response.status(404).json({ error: 'Pengguna tujuan tidak ditemukan' })
    return
  }

  const client = await pool.connect()
  try {
    await client.query('begin')
    const existing = await client.query(
      'select 1 from follows where follower_id = $1 and following_id = $2',
      [followerId, followingId],
    )

    if (existing.rows[0]) {
      await client.query('delete from follows where follower_id = $1 and following_id = $2', [
        followerId,
        followingId,
      ])
      await client.query(
        'update users set following = greatest(0, following - 1) where id = $1',
        [followerId],
      )
      await client.query(
        'update users set followers = greatest(0, followers - 1) where id = $1',
        [followingId],
      )
    } else {
      await client.query('insert into follows (follower_id, following_id) values ($1, $2)', [
        followerId,
        followingId,
      ])
      await client.query('update users set following = following + 1 where id = $1', [
        followerId,
      ])
      await client.query('update users set followers = followers + 1 where id = $1', [
        followingId,
      ])
    }

    await client.query('commit')
    const follower = await findUser(followerId)
    response.json({ following: !existing.rows[0], user: follower })
  } catch (error) {
    await client.query('rollback')
    throw error
  } finally {
    client.release()
  }
}))

app.post('/api/challenges/:id/join', asyncRoute(async (request, response) => {
  const userId = request.user.id

  const challenge = await pool.query('select 1 from challenges where id = $1', [
    request.params.id,
  ])
  if (!challenge.rows[0]) {
    response.status(404).json({ error: 'Tantangan tidak ditemukan' })
    return
  }

  const existing = await pool.query(
    'select 1 from challenge_participants where challenge_id = $1 and user_id = $2',
    [request.params.id, userId],
  )

  if (existing.rows[0]) {
    await pool.query(
      'delete from challenge_participants where challenge_id = $1 and user_id = $2',
      [request.params.id, userId],
    )
  } else {
    await pool.query(
      'insert into challenge_participants (challenge_id, user_id) values ($1, $2)',
      [request.params.id, userId],
    )
  }

  const participants = await countChallengeParticipants(request.params.id)
  response.json({ joined: !existing.rows[0], participants })
}))

app.post('/api/clubs/:id/join', asyncRoute(async (request, response) => {
  const userId = request.user.id

  const club = await pool.query('select 1 from clubs where id = $1', [request.params.id])
  if (!club.rows[0]) {
    response.status(404).json({ error: 'Klub tidak ditemukan' })
    return
  }

  const existing = await pool.query(
    'select 1 from club_members where club_id = $1 and user_id = $2',
    [request.params.id, userId],
  )

  if (existing.rows[0]) {
    await pool.query('delete from club_members where club_id = $1 and user_id = $2', [
      request.params.id,
      userId,
    ])
  } else {
    await pool.query('insert into club_members (club_id, user_id) values ($1, $2)', [
      request.params.id,
      userId,
    ])
  }

  const members = await countClubMembers(request.params.id)
  response.json({ joined: !existing.rows[0], members })
}))

const geocodeCache = new Map()

app.get('/api/geocode/reverse', asyncRoute(async (request, response) => {
  const lat = Number(request.query.lat)
  const lng = Number(request.query.lng)

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    response.status(400).json({ error: 'Koordinat tidak valid' })
    return
  }

  const key = `${lat.toFixed(3)},${lng.toFixed(3)}`
  const cached = geocodeCache.get(key)
  if (cached && Date.now() - cached.time < 60 * 60 * 1000) {
    response.json(cached.value)
    return
  }

  try {
    const url = new URL('https://nominatim.openstreetmap.org/reverse')
    url.searchParams.set('format', 'jsonv2')
    url.searchParams.set('lat', String(lat))
    url.searchParams.set('lon', String(lng))
    url.searchParams.set('accept-language', 'id')
    url.searchParams.set('zoom', '14')

    const geocodeResponse = await fetch(url, {
      headers: {
        'User-Agent': 'Gerakin/1.0 (local fitness app)',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(6000),
    })

    if (!geocodeResponse.ok) throw new Error(`Nominatim ${geocodeResponse.status}`)
    const data = await geocodeResponse.json()
    const address = data.address ?? {}
    const city =
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      address.county ||
      ''
    const label =
      [address.suburb, city].filter(Boolean).join(', ') ||
      data.display_name?.split(',').slice(0, 2).join(',').trim() ||
      'Lokasi saat ini'
    const value = { label, city, displayName: data.display_name ?? label }
    geocodeCache.set(key, { time: Date.now(), value })
    response.json(value)
  } catch (error) {
    console.warn('Reverse geocode gagal:', error.message)
    response.json({ label: null, city: null, displayName: null })
  }
}))

app.use('/api', (_request, response) => {
  response.status(404).json({ error: 'Endpoint API tidak ditemukan' })
})

const distDir = resolve(process.cwd(), 'dist')
if (existsSync(distDir)) {
  app.use(express.static(distDir))
  app.use((request, response, next) => {
    if (request.path.startsWith('/api')) {
      next()
      return
    }
    response.sendFile(resolve(distDir, 'index.html'))
  })
}

app.use((error, _request, response, _next) => {
  console.error(error)
  response.status(500).json({ error: 'Terjadi kesalahan pada server' })
})

const server = app.listen(port, () => {
  console.log(`Gerakin API berjalan di http://127.0.0.1:${port}`)
})

async function shutdown() {
  server.close()
  await pool.end()
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

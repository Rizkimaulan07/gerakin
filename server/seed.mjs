import 'dotenv/config'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import {
  CURRENT_USER_ID,
  DEFAULT_CHALLENGES,
  DEFAULT_CLUBS,
  DEFAULT_FOLLOWS,
  DEFAULT_KUDOS,
  activities,
  challenges,
  clubs,
  comments,
  popularRoutes,
  users,
} from './seed-data.mjs'

const { Client } = pg

const connectionString = process.env.DATABASE_URL
const reset = process.argv.includes('--reset')

const dbName = connectionString
  ? decodeURIComponent(new URL(connectionString).pathname.replace(/^\//, ''))
  : process.env.PGDATABASE || 'gerakin'

if (!connectionString && !/^[a-zA-Z0-9_]+$/.test(dbName)) {
  throw new Error('PGDATABASE hanya boleh berisi huruf, angka, dan garis bawah.')
}

const baseConfig = {
  host: process.env.PGHOST || '127.0.0.1',
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || '',
}

async function ensureDatabase() {
  const admin = new Client({ ...baseConfig, database: 'postgres' })
  await admin.connect()
  try {
    const existing = await admin.query('select 1 from pg_database where datname = $1', [dbName])
    if (existing.rowCount === 0) {
      await admin.query(`create database "${dbName}"`)
      console.log(`Database "${dbName}" dibuat.`)
    } else {
      console.log(`Database "${dbName}" sudah ada.`)
    }
  } finally {
    await admin.end()
  }
}

async function seedDatabase() {
  const client = connectionString
    ? new Client({ connectionString })
    : new Client({ ...baseConfig, database: dbName })
  await client.connect()

  try {
    const schemaPath = fileURLToPath(new URL('./schema.sql', import.meta.url))
    const schema = await readFile(schemaPath, 'utf8')
    await client.query(schema)

    if (reset) {
      await client.query(`
        truncate table
          activity_kudos,
          activity_comments,
          challenge_participants,
          club_members,
          follows,
          activities,
          popular_routes,
          challenges,
          clubs,
          users
        restart identity cascade
      `)
      console.log('Data lama dihapus (mode --reset).')
    }

    await client.query('begin')

    for (const user of users) {
      await client.query(
        `insert into users
          (id, name, username, initials, color, bio, city, followers, following, weekly_goal_km, joined_at)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         on conflict (id) do nothing`,
        [
          user.id,
          user.name,
          user.username,
          user.initials,
          user.color,
          user.bio,
          user.city,
          user.followers,
          user.following,
          user.weeklyGoalKm,
          user.joinedAt,
        ],
      )
    }

    for (const activity of activities) {
      await client.query(
        `insert into activities
          (id, user_id, sport, title, description, date, distance_m, duration_s, elevation_m,
           calories, avg_heart_rate, route, location, is_manual, kudos_base)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
         on conflict (id) do nothing`,
        [
          activity.id,
          activity.userId,
          activity.sport,
          activity.title,
          activity.description,
          activity.date,
          activity.distanceM,
          activity.durationS,
          activity.elevationM,
          activity.calories,
          activity.avgHeartRate,
          JSON.stringify(activity.route),
          activity.location,
          activity.isManual,
          activity.kudos,
        ],
      )
    }

    for (const comment of comments) {
      await client.query(
        `insert into activity_comments (id, activity_id, user_id, body, created_at)
         values ($1, $2, $3, $4, $5)
         on conflict (id) do nothing`,
        [comment.id, comment.activityId, comment.userId, comment.body, comment.createdAt],
      )
    }

    for (const challenge of challenges) {
      await client.query(
        `insert into challenges
          (id, title, description, metric, target, unit, participants_base, days_left, reward, accent)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         on conflict (id) do nothing`,
        [
          challenge.id,
          challenge.title,
          challenge.description,
          challenge.metric,
          challenge.target,
          challenge.unit,
          challenge.participantsBase,
          challenge.daysLeft,
          challenge.reward,
          challenge.accent,
        ],
      )
    }

    for (const club of clubs) {
      await client.query(
        `insert into clubs
          (id, name, city, description, initials, color, weekly_km, members_base, lat, lng)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         on conflict (id) do nothing`,
        [
          club.id,
          club.name,
          club.city,
          club.description,
          club.initials,
          club.color,
          club.weeklyKm,
          club.members,
          club.lat,
          club.lng,
        ],
      )
    }

    for (const route of popularRoutes) {
      await client.query(
        `insert into popular_routes
          (id, name, location, distance_km, elevation_m, rating, sport, route)
         values ($1, $2, $3, $4, $5, $6, $7, $8)
         on conflict (id) do nothing`,
        [
          route.id,
          route.name,
          route.location,
          route.distanceKm,
          route.elevationM,
          route.rating,
          route.sport,
          JSON.stringify(route.route),
        ],
      )
    }

    for (const userId of DEFAULT_FOLLOWS) {
      await client.query(
        `insert into follows (follower_id, following_id)
         values ($1, $2)
         on conflict do nothing`,
        [CURRENT_USER_ID, userId],
      )
    }

    for (const challengeId of DEFAULT_CHALLENGES) {
      await client.query(
        `insert into challenge_participants (challenge_id, user_id)
         values ($1, $2)
         on conflict do nothing`,
        [challengeId, CURRENT_USER_ID],
      )
    }

    for (const clubId of DEFAULT_CLUBS) {
      await client.query(
        `insert into club_members (club_id, user_id)
         values ($1, $2)
         on conflict do nothing`,
        [clubId, CURRENT_USER_ID],
      )
    }

    for (const activityId of DEFAULT_KUDOS) {
      await client.query(
        `insert into activity_kudos (activity_id, user_id)
         values ($1, $2)
         on conflict do nothing`,
        [activityId, CURRENT_USER_ID],
      )
    }

    await client.query('commit')

    const summary = await client.query(`
      select
        (select count(*)::int from users) as users,
        (select count(*)::int from activities) as activities,
        (select count(*)::int from activity_comments) as comments,
        (select count(*)::int from challenges) as challenges,
        (select count(*)::int from clubs) as clubs,
        (select count(*)::int from popular_routes) as routes
    `)
    console.log('Seed selesai:', summary.rows[0])
  } catch (error) {
    await client.query('rollback').catch(() => {})
    throw error
  } finally {
    await client.end()
  }
}

try {
  if (!connectionString) await ensureDatabase()
  await seedDatabase()
  console.log('PostgreSQL siap dipakai Gerakin.')
} catch (error) {
  console.error('Gagal menyiapkan database:', error.message)
  process.exitCode = 1
}

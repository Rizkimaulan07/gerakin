import 'dotenv/config'
import pg from 'pg'

const { Pool } = pg

const connectionString = process.env.DATABASE_URL

const pool = connectionString
  ? new Pool({ connectionString, max: 10 })
  : new Pool({
      host: process.env.PGHOST || '127.0.0.1',
      port: Number(process.env.PGPORT || 5432),
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || '',
      database: process.env.PGDATABASE || 'gerakin',
      max: 10,
    })

pool.on('error', (error) => {
  console.error('Koneksi PostgreSQL bermasalah:', error.message)
})

export function mapUser(row) {
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    initials: row.initials,
    color: row.color,
    bio: row.bio,
    city: row.city,
    followers: Number(row.followers),
    following: Number(row.following),
    weeklyGoalKm: Number(row.weekly_goal_km),
    joinedAt: row.joined_at,
  }
}

function mapComment(row) {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    initials: row.initials,
    color: row.color,
    text: row.body,
    createdAt: row.created_at,
  }
}

function mapActivity(row, comments = []) {
  const route = Array.isArray(row.route) ? row.route : JSON.parse(row.route || '[]')

  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    userInitials: row.user_initials,
    userColor: row.user_color,
    sport: row.sport,
    title: row.title,
    description: row.description,
    date: row.date,
    distanceM: Number(row.distance_m),
    durationS: Number(row.duration_s),
    elevationM: Number(row.elevation_m),
    calories: Number(row.calories),
    avgHeartRate: row.avg_heart_rate === null ? undefined : Number(row.avg_heart_rate),
    route,
    location: row.location,
    kudos: Number(row.kudos),
    comments,
    isManual: row.is_manual,
  }
}

function mapChallenge(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    metric: row.metric,
    target: Number(row.target),
    unit: row.unit,
    participants: Number(row.participants),
    daysLeft: Number(row.days_left),
    reward: row.reward,
    accent: row.accent,
  }
}

function mapClub(row) {
  return {
    id: row.id,
    name: row.name,
    city: row.city,
    members: Number(row.members),
    description: row.description,
    initials: row.initials,
    color: row.color,
    weeklyKm: Number(row.weekly_km),
    lat: row.lat === null ? undefined : Number(row.lat),
    lng: row.lng === null ? undefined : Number(row.lng),
  }
}

function mapRoute(row) {
  const route = Array.isArray(row.route) ? row.route : JSON.parse(row.route || '[]')

  return {
    id: row.id,
    name: row.name,
    location: row.location,
    distanceKm: Number(row.distance_km),
    elevationM: Number(row.elevation_m),
    rating: Number(row.rating),
    sport: row.sport,
    route,
  }
}

export async function findUser(userId) {
  const result = await pool.query('select * from users where id = $1', [userId])
  return result.rows[0] ? mapUser(result.rows[0]) : null
}

export async function getActivities() {
  const [activityResult, commentResult] = await Promise.all([
    pool.query(`
      select
        a.*,
        u.name as user_name,
        u.initials as user_initials,
        u.color as user_color,
        a.kudos_base + (
          select count(*)::int from activity_kudos k where k.activity_id = a.id
        ) as kudos
      from activities a
      join users u on u.id = a.user_id
      order by a.date desc
    `),
    pool.query(`
      select c.id, c.activity_id, c.body, c.created_at,
             u.id as user_id, u.name, u.initials, u.color
      from activity_comments c
      join users u on u.id = c.user_id
      order by c.created_at asc
    `),
  ])

  const commentsByActivity = new Map()
  for (const row of commentResult.rows) {
    const current = commentsByActivity.get(row.activity_id) ?? []
    current.push(mapComment(row))
    commentsByActivity.set(row.activity_id, current)
  }

  return activityResult.rows.map((row) =>
    mapActivity(row, commentsByActivity.get(row.id) ?? []),
  )
}

export async function getActivity(activityId) {
  const result = await pool.query(
    `select a.*, u.name as user_name, u.initials as user_initials, u.color as user_color,
            a.kudos_base + (
              select count(*)::int from activity_kudos k where k.activity_id = a.id
            ) as kudos
     from activities a
     join users u on u.id = a.user_id
     where a.id = $1`,
    [activityId],
  )

  if (!result.rows[0]) return null

  const comments = await pool.query(
    `select c.id, c.body, c.created_at, u.id as user_id, u.name, u.initials, u.color
     from activity_comments c
     join users u on u.id = c.user_id
     where c.activity_id = $1
     order by c.created_at asc`,
    [activityId],
  )

  return mapActivity(result.rows[0], comments.rows.map(mapComment))
}

export async function getChallenges(userId) {
  const result = await pool.query(`
    select c.*,
           c.participants_base + (
             select count(*)::int from challenge_participants cp where cp.challenge_id = c.id
           ) as participants
    from challenges c
    order by array_position(
      array['challenge-100k', 'challenge-streak', 'challenge-elevation', 'challenge-ride', 'challenge-morning'],
      c.id
    ), c.days_left asc
  `)

  return result.rows.map(mapChallenge)
}

export async function getClubs() {
  const result = await pool.query(`
    select c.*,
           c.members_base + (
             select count(*)::int from club_members cm where cm.club_id = c.id
           ) as members
    from clubs c
    order by array_position(
      array['club-gbk', 'club-nightride', 'club-trail', 'club-sore'],
      c.id
    ), c.weekly_km desc
  `)

  return result.rows.map(mapClub)
}

export async function getPopularRoutes() {
  const result = await pool.query(`
    select *
    from popular_routes
    order by array_position(
      array['route-gbk', 'route-monas', 'route-dago', 'route-sanur'],
      id
    )
  `)

  return result.rows.map(mapRoute)
}

export async function getLeaderboard(currentUserId) {
  const result = await pool.query(
    `select u.id, u.name, u.initials, u.color,
            coalesce(sum(a.distance_m), 0)::float8 / 1000 as distance_km,
            coalesce(sum(a.elevation_m), 0)::float8 as elevation_m,
            case
              when coalesce(sum(a.distance_m), 0) > 0
                then sum(a.duration_s)::float8 / (sum(a.distance_m) / 1000)
              else 0
            end as avg_pace_s
     from users u
     left join activities a
       on a.user_id = u.id
      and a.date >= now() - interval '7 days'
     group by u.id
     having coalesce(sum(a.distance_m), 0) > 0
     order by distance_km desc, avg_pace_s asc
     limit 50`,
    [],
  )

  return result.rows.map((row, index) => ({
    rank: index + 1,
    userId: row.id,
    name: row.name,
    initials: row.initials,
    color: row.color,
    distanceKm: Number(Number(row.distance_km).toFixed(1)),
    elevationM: Math.round(Number(row.elevation_m)),
    avgPaceS: Math.round(Number(row.avg_pace_s)),
    isCurrentUser: row.id === currentUserId,
  }))
}

export async function getBootstrap(userId) {
  const user = await findUser(userId)
  if (!user) return null

  const [
    activities,
    challenges,
    clubs,
    popularRoutes,
    leaderboard,
    followingResult,
    kudosResult,
    joinedChallengesResult,
    joinedClubsResult,
  ] = await Promise.all([
    getActivities(),
    getChallenges(userId),
    getClubs(),
    getPopularRoutes(),
    getLeaderboard(userId),
    pool.query('select following_id from follows where follower_id = $1 order by created_at', [
      userId,
    ]),
    pool.query('select activity_id from activity_kudos where user_id = $1', [userId]),
    pool.query('select challenge_id from challenge_participants where user_id = $1', [userId]),
    pool.query('select club_id from club_members where user_id = $1', [userId]),
  ])

  return {
    user,
    activities,
    challenges,
    clubs,
    popularRoutes,
    leaderboard,
    following: followingResult.rows.map((row) => row.following_id),
    kudosGiven: kudosResult.rows.map((row) => row.activity_id),
    joinedChallenges: joinedChallengesResult.rows.map((row) => row.challenge_id),
    joinedClubs: joinedClubsResult.rows.map((row) => row.club_id),
    serverTime: new Date().toISOString(),
  }
}

export async function countActivityKudos(activityId) {
  const result = await pool.query(
    `select a.kudos_base + (
       select count(*)::int from activity_kudos k where k.activity_id = a.id
     ) as kudos
     from activities a where a.id = $1`,
    [activityId],
  )

  return result.rows[0] ? Number(result.rows[0].kudos) : null
}

export async function countChallengeParticipants(challengeId) {
  const result = await pool.query(
    `select c.participants_base + (
       select count(*)::int from challenge_participants cp where cp.challenge_id = c.id
     ) as participants
     from challenges c where c.id = $1`,
    [challengeId],
  )

  return result.rows[0] ? Number(result.rows[0].participants) : null
}

export async function countClubMembers(clubId) {
  const result = await pool.query(
    `select c.members_base + (
       select count(*)::int from club_members cm where cm.club_id = c.id
     ) as members
     from clubs c where c.id = $1`,
    [clubId],
  )

  return result.rows[0] ? Number(result.rows[0].members) : null
}

export async function checkHealth() {
  const result = await pool.query('select now() as time')
  return result.rows[0].time
}

export { pool }

create table if not exists users (
  id text primary key,
  name text not null,
  username text not null unique,
  initials text not null,
  color text not null default '#b6f240',
  bio text not null default '',
  city text not null default '',
  followers integer not null default 0,
  following integer not null default 0,
  weekly_goal_km integer not null default 50,
  joined_at timestamptz not null default now()
);

alter table users add column if not exists email text;
alter table users add column if not exists password_hash text;

create unique index if not exists users_email_lower_idx
  on users (lower(email))
  where email is not null;

create table if not exists auth_sessions (
  token_hash text primary key,
  user_id text not null references users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists auth_sessions_expiry_idx on auth_sessions (expires_at);

create table if not exists activities (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  sport text not null,
  title text not null,
  description text not null default '',
  date timestamptz not null,
  distance_m double precision not null default 0,
  duration_s integer not null default 0,
  elevation_m double precision not null default 0,
  calories integer not null default 0,
  avg_heart_rate integer,
  route jsonb not null default '[]'::jsonb,
  location text not null default '',
  is_manual boolean not null default false,
  kudos_base integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists activities_user_date_idx on activities (user_id, date desc);
create index if not exists activities_date_idx on activities (date desc);

create table if not exists activity_kudos (
  activity_id text not null references activities(id) on delete cascade,
  user_id text not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (activity_id, user_id)
);

create table if not exists activity_comments (
  id text primary key,
  activity_id text not null references activities(id) on delete cascade,
  user_id text not null references users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists activity_comments_activity_idx on activity_comments (activity_id, created_at);

create table if not exists follows (
  follower_id text not null references users(id) on delete cascade,
  following_id text not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create table if not exists challenges (
  id text primary key,
  title text not null,
  description text not null default '',
  metric text not null check (metric in ('distance', 'elevation', 'streak')),
  target numeric not null default 0,
  unit text not null default 'km',
  participants_base integer not null default 0,
  days_left integer not null default 0,
  reward text not null default '',
  accent text not null default '#b6f240'
);

create table if not exists challenge_participants (
  challenge_id text not null references challenges(id) on delete cascade,
  user_id text not null references users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (challenge_id, user_id)
);

create table if not exists clubs (
  id text primary key,
  name text not null,
  city text not null default '',
  description text not null default '',
  initials text not null,
  color text not null default '#b6f240',
  weekly_km integer not null default 0,
  members_base integer not null default 0,
  lat double precision,
  lng double precision
);

create table if not exists club_members (
  club_id text not null references clubs(id) on delete cascade,
  user_id text not null references users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (club_id, user_id)
);

create table if not exists popular_routes (
  id text primary key,
  name text not null,
  location text not null default '',
  distance_km numeric not null default 0,
  elevation_m integer not null default 0,
  rating numeric not null default 0,
  sport text not null default 'run',
  route jsonb not null default '[]'::jsonb
);

export type SportKey =
  | 'run'
  | 'ride'
  | 'walk'
  | 'hike'
  | 'swim'
  | 'gym'
  | 'football'
  | 'yoga'

export interface LatLng {
  lat: number
  lng: number
}

export interface User {
  id: string
  name: string
  username: string
  initials: string
  color: string
  bio: string
  city: string
  followers: number
  following: number
  weeklyGoalKm: number
  joinedAt: string
}

export interface ActivityComment {
  id: string
  userId: string
  name: string
  initials: string
  color: string
  text: string
  createdAt: string
}

export interface Activity {
  id: string
  userId: string
  userName: string
  userInitials: string
  userColor: string
  sport: SportKey
  title: string
  description: string
  date: string
  distanceM: number
  durationS: number
  elevationM: number
  calories: number
  avgHeartRate?: number
  route: LatLng[]
  location: string
  kudos: number
  comments: ActivityComment[]
  isManual?: boolean
}

export interface Challenge {
  id: string
  title: string
  description: string
  metric: 'distance' | 'elevation' | 'streak'
  target: number
  unit: string
  participants: number
  daysLeft: number
  reward: string
  accent: string
  joinedByDefault?: boolean
}

export interface Club {
  id: string
  name: string
  city: string
  members: number
  description: string
  initials: string
  color: string
  weeklyKm: number
  lat?: number
  lng?: number
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: 'zap' | 'flame' | 'trophy' | 'mountain' | 'medal' | 'target'
  unlocked: boolean
  unlockedAt?: string
}

export interface RouteSpot {
  id: string
  name: string
  location: string
  distanceKm: number
  elevationM: number
  rating: number
  sport: SportKey
  route: LatLng[]
}

export interface LeaderboardEntry {
  rank: number
  userId?: string
  name: string
  initials: string
  color: string
  distanceKm: number
  elevationM: number
  avgPaceS: number
  isCurrentUser?: boolean
}

export interface WeeklyPoint {
  day: string
  distanceKm: number
  durationMin: number
}

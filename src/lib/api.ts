import type {
  Activity,
  ActivityComment,
  Challenge,
  Club,
  LeaderboardEntry,
  RouteSpot,
  User,
} from '@/types'

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    throw new ApiError(
      (payload as { error?: string } | null)?.error ?? `Permintaan gagal (${response.status})`,
      response.status,
    )
  }

  return response.json() as Promise<T>
}

export interface BootstrapData {
  user: User
  activities: Activity[]
  challenges: Challenge[]
  clubs: Club[]
  popularRoutes: RouteSpot[]
  leaderboard: LeaderboardEntry[]
  following: string[]
  kudosGiven: string[]
  joinedChallenges: string[]
  joinedClubs: string[]
  serverTime: string
}

export interface AuthCredentials {
  email: string
  password: string
}

export interface RegistrationDetails extends AuthCredentials {
  name: string
}

export interface ReverseGeocodeResult {
  label: string | null
  city: string | null
  displayName: string | null
}

export const api = {
  session() {
    return request<{ user: User | null }>('/auth/session')
  },

  login(credentials: AuthCredentials) {
    return request<{ user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
  },

  register(details: RegistrationDetails) {
    return request<{ user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(details),
    })
  },

  logout() {
    return request<{ ok: boolean }>('/auth/logout', { method: 'POST' })
  },

  bootstrap() {
    return request<BootstrapData>('/bootstrap')
  },

  createActivity(activity: Activity) {
    return request<{ activity: Activity }>('/activities', {
      method: 'POST',
      body: JSON.stringify(activity),
    })
  },

  deleteActivity(activityId: string) {
    return request<{ ok: boolean }>(
      `/activities/${encodeURIComponent(activityId)}`,
      { method: 'DELETE' },
    )
  },

  toggleKudos(activityId: string) {
    return request<{ given: boolean; kudos: number }>(
      `/activities/${encodeURIComponent(activityId)}/kudos`,
      { method: 'POST' },
    )
  },

  addComment(activityId: string, text: string) {
    return request<{ comment: ActivityComment }>(
      `/activities/${encodeURIComponent(activityId)}/comments`,
      { method: 'POST', body: JSON.stringify({ text }) },
    )
  },

  updateProfile(
    userId: string,
    patch: Partial<Pick<User, 'name' | 'bio' | 'city' | 'weeklyGoalKm'>>,
  ) {
    return request<{ user: User }>(`/users/${encodeURIComponent(userId)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    })
  },

  toggleFollow(userId: string) {
    return request<{ following: boolean; user: User }>(
      `/users/${encodeURIComponent(userId)}/follow`,
      { method: 'POST' },
    )
  },

  toggleChallenge(challengeId: string) {
    return request<{ joined: boolean; participants: number }>(
      `/challenges/${encodeURIComponent(challengeId)}/join`,
      { method: 'POST' },
    )
  },

  toggleClub(clubId: string) {
    return request<{ joined: boolean; members: number }>(
      `/clubs/${encodeURIComponent(clubId)}/join`,
      { method: 'POST' },
    )
  },

  reverseGeocode(lat: number, lng: number) {
    return request<ReverseGeocodeResult>(
      `/geocode/reverse?lat=${lat.toFixed(5)}&lng=${lng.toFixed(5)}`,
    )
  },
}

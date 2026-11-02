import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { toast } from 'sonner'
import {
  challenges as fallbackChallenges,
  clubs as fallbackClubs,
  currentUser as fallbackUser,
  leaderboard as fallbackLeaderboard,
  mockActivities as fallbackActivities,
  popularRoutes as fallbackRoutes,
} from '@/data/mock'
import { api, type AuthCredentials, type RegistrationDetails } from '@/lib/api'
import type {
  Activity,
  ActivityComment,
  Challenge,
  Club,
  LeaderboardEntry,
  RouteSpot,
  User,
} from '@/types'

type Theme = 'dark' | 'light'
type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated' | 'error'

type ProfilePatch = Partial<Pick<User, 'name' | 'bio' | 'city' | 'weeklyGoalKm'>>

interface AppState {
  theme: Theme
  authStatus: AuthStatus
  authError: string | null
  user: User
  activities: Activity[]
  challenges: Challenge[]
  clubs: Club[]
  popularRoutes: RouteSpot[]
  leaderboard: LeaderboardEntry[]
  kudosGiven: string[]
  joinedChallenges: string[]
  joinedClubs: string[]
  following: string[]
  hydrated: boolean
  isHydrating: boolean
  isOnline: boolean
  syncError: string | null
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
  checkSession: () => Promise<void>
  login: (credentials: AuthCredentials) => Promise<void>
  register: (details: RegistrationDetails) => Promise<void>
  logout: () => Promise<void>
  hydrate: (force?: boolean) => Promise<void>
  addActivity: (activity: Activity) => Promise<{ activity: Activity; synced: boolean }>
  deleteActivity: (activityId: string) => Promise<boolean>
  toggleKudos: (activityId: string) => Promise<void>
  addComment: (activityId: string, text: string) => Promise<void>
  joinChallenge: (challengeId: string) => Promise<void>
  toggleClub: (clubId: string) => Promise<void>
  toggleFollow: (userId: string) => Promise<void>
  updateProfile: (patch: ProfilePatch) => Promise<void>
}

function computeLeaderboard(activities: Activity[], currentUserId: string): LeaderboardEntry[] {
  const weekStart = Date.now() - 7 * 24 * 60 * 60 * 1000
  const byUser = new Map<
    string,
    {
      userId: string
      name: string
      initials: string
      color: string
      distanceM: number
      durationS: number
      elevationM: number
    }
  >()

  for (const activity of activities) {
    if (new Date(activity.date).getTime() < weekStart || activity.distanceM <= 0) continue
    const current = byUser.get(activity.userId) ?? {
      userId: activity.userId,
      name: activity.userName,
      initials: activity.userInitials,
      color: activity.userColor,
      distanceM: 0,
      durationS: 0,
      elevationM: 0,
    }
    current.distanceM += activity.distanceM
    current.durationS += activity.durationS
    current.elevationM += activity.elevationM
    byUser.set(activity.userId, current)
  }

  return [...byUser.values()]
    .sort((a, b) => b.distanceM - a.distanceM)
    .slice(0, 50)
    .map((entry, index) => ({
      rank: index + 1,
      userId: entry.userId,
      name: entry.name,
      initials: entry.initials,
      color: entry.color,
      distanceKm: Number((entry.distanceM / 1000).toFixed(1)),
      elevationM: Math.round(entry.elevationM),
      avgPaceS: entry.distanceM > 0 ? Math.round(entry.durationS / (entry.distanceM / 1000)) : 0,
      isCurrentUser: entry.userId === currentUserId,
    }))
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      authStatus: 'checking',
      authError: null,
      user: fallbackUser,
      activities: fallbackActivities,
      challenges: fallbackChallenges,
      clubs: fallbackClubs,
      popularRoutes: fallbackRoutes,
      leaderboard: fallbackLeaderboard,
      kudosGiven: ['act-2', 'act-6'],
      joinedChallenges: fallbackChallenges
        .filter((challenge) => challenge.joinedByDefault)
        .map((challenge) => challenge.id),
      joinedClubs: ['club-gbk'],
      following: ['u-dinda', 'u-bagas', 'u-fajar', 'u-naya'],
      hydrated: false,
      isHydrating: false,
      isOnline: true,
      syncError: null,

      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      setTheme: (theme) => set({ theme }),

      checkSession: async () => {
        try {
          const { user } = await api.session()
          if (!user) {
            set({ authStatus: 'unauthenticated', authError: null })
            return
          }

          set({ authStatus: 'authenticated', authError: null, user })
          await get().hydrate(true)
        } catch (error) {
          set({
            authStatus: 'error',
            authError: error instanceof Error ? error.message : 'Server tidak tersambung.',
          })
        }
      },

      login: async (credentials) => {
        const { user } = await api.login(credentials)
        set({ authStatus: 'authenticated', authError: null, user })
        await get().hydrate(true)
      },

      register: async (details) => {
        const { user } = await api.register(details)
        set({ authStatus: 'authenticated', authError: null, user })
        await get().hydrate(true)
      },

      logout: async () => {
        await api.logout()
        set({
          authStatus: 'unauthenticated',
          authError: null,
          user: fallbackUser,
          activities: fallbackActivities,
          challenges: fallbackChallenges,
          clubs: fallbackClubs,
          popularRoutes: fallbackRoutes,
          leaderboard: fallbackLeaderboard,
          kudosGiven: ['act-2', 'act-6'],
          joinedChallenges: fallbackChallenges
            .filter((challenge) => challenge.joinedByDefault)
            .map((challenge) => challenge.id),
          joinedClubs: ['club-gbk'],
          following: ['u-dinda', 'u-bagas', 'u-fajar', 'u-naya'],
          hydrated: false,
          isHydrating: false,
          isOnline: true,
          syncError: null,
        })
      },

      hydrate: async (force = false) => {
        if (get().isHydrating || (get().hydrated && !force)) return
        set({ isHydrating: true, syncError: null })

        try {
          const data = await api.bootstrap()
          set({
            user: data.user,
            activities: data.activities,
            challenges: data.challenges,
            clubs: data.clubs,
            popularRoutes: data.popularRoutes,
            leaderboard: data.leaderboard,
            kudosGiven: data.kudosGiven,
            joinedChallenges: data.joinedChallenges,
            joinedClubs: data.joinedClubs,
            following: data.following,
            hydrated: true,
            isHydrating: false,
            isOnline: true,
            syncError: null,
          })
        } catch (error) {
          set({
            hydrated: true,
            isHydrating: false,
            isOnline: false,
            syncError: error instanceof Error ? error.message : 'Server tidak tersambung',
          })
        }
      },

      addActivity: async (activity) => {
        set((state) => ({
          activities: [activity, ...state.activities],
          leaderboard: computeLeaderboard([activity, ...state.activities], state.user.id),
        }))

        try {
          const { activity: saved } = await api.createActivity(activity)
          set((state) => {
            const activities = state.activities.map((item) =>
              item.id === activity.id ? saved : item,
            )
            return {
              activities,
              leaderboard: computeLeaderboard(activities, state.user.id),
              isOnline: true,
            }
          })
          return { activity: saved, synced: true }
        } catch (error) {
          set({ isOnline: false })
          toast.error(
            error instanceof Error
              ? `Tersimpan lokal. ${error.message}`
              : 'Tersimpan lokal. Server database tidak tersambung.',
          )
          return { activity, synced: false }
        }
      },

      deleteActivity: async (activityId) => {
        const snapshot = get().activities
        const target = snapshot.find((activity) => activity.id === activityId)
        if (!target) return false

        set((state) => {
          const activities = state.activities.filter((activity) => activity.id !== activityId)
          return {
            activities,
            leaderboard: computeLeaderboard(activities, state.user.id),
            kudosGiven: state.kudosGiven.filter((id) => id !== activityId),
          }
        })

        try {
          await api.deleteActivity(activityId)
          set({ isOnline: true })
          return true
        } catch (error) {
          set({
            activities: snapshot,
            leaderboard: computeLeaderboard(snapshot, get().user.id),
            isOnline: false,
          })
          toast.error(error instanceof Error ? error.message : 'Gagal menghapus aktivitas')
          return false
        }
      },

      toggleKudos: async (activityId) => {
        const state = get()
        const wasGiven = state.kudosGiven.includes(activityId)
        const previousKudos = state.activities.find((item) => item.id === activityId)?.kudos ?? 0

        set({
          kudosGiven: wasGiven
            ? state.kudosGiven.filter((id) => id !== activityId)
            : [...state.kudosGiven, activityId],
          activities: state.activities.map((activity) =>
            activity.id === activityId
              ? { ...activity, kudos: Math.max(0, activity.kudos + (wasGiven ? -1 : 1)) }
              : activity,
          ),
        })

        try {
          const result = await api.toggleKudos(activityId)
          set((current) => ({
            kudosGiven: result.given
              ? [...new Set([...current.kudosGiven, activityId])]
              : current.kudosGiven.filter((id) => id !== activityId),
            activities: current.activities.map((activity) =>
              activity.id === activityId ? { ...activity, kudos: result.kudos } : activity,
            ),
            isOnline: true,
          }))
        } catch {
          set((current) => ({
            kudosGiven: wasGiven
              ? [...new Set([...current.kudosGiven, activityId])]
              : current.kudosGiven.filter((id) => id !== activityId),
            activities: current.activities.map((activity) =>
              activity.id === activityId ? { ...activity, kudos: previousKudos } : activity,
            ),
            isOnline: false,
          }))
          toast.error('Gagal menyimpan kudos. Coba lagi.')
        }
      },

      addComment: async (activityId, rawText) => {
        const text = rawText.trim()
        if (!text) return

        const state = get()
        const optimisticId = `local-${Date.now()}`
        const optimistic: ActivityComment = {
          id: optimisticId,
          userId: state.user.id,
          name: state.user.name,
          initials: state.user.initials,
          color: state.user.color,
          text,
          createdAt: new Date().toISOString(),
        }

        set((current) => ({
          activities: current.activities.map((activity) =>
            activity.id === activityId
              ? { ...activity, comments: [...activity.comments, optimistic] }
              : activity,
          ),
        }))

        try {
          const { comment } = await api.addComment(activityId, text)
          set((current) => ({
            activities: current.activities.map((activity) =>
              activity.id === activityId
                ? {
                    ...activity,
                    comments: activity.comments.map((item) =>
                      item.id === optimisticId ? comment : item,
                    ),
                  }
                : activity,
            ),
            isOnline: true,
          }))
        } catch {
          set((current) => ({
            activities: current.activities.map((activity) =>
              activity.id === activityId
                ? {
                    ...activity,
                    comments: activity.comments.filter((item) => item.id !== optimisticId),
                  }
                : activity,
            ),
            isOnline: false,
          }))
          toast.error('Komentar gagal dikirim. Coba lagi.')
        }
      },

      joinChallenge: async (challengeId) => {
        const state = get()
        const wasJoined = state.joinedChallenges.includes(challengeId)
        const challenge = state.challenges.find((item) => item.id === challengeId)

        set({
          joinedChallenges: wasJoined
            ? state.joinedChallenges.filter((id) => id !== challengeId)
            : [...state.joinedChallenges, challengeId],
          challenges: state.challenges.map((item) =>
            item.id === challengeId
              ? { ...item, participants: Math.max(0, item.participants + (wasJoined ? -1 : 1)) }
              : item,
          ),
        })

        try {
          const result = await api.toggleChallenge(challengeId)
          set((current) => ({
            joinedChallenges: result.joined
              ? [...new Set([...current.joinedChallenges, challengeId])]
              : current.joinedChallenges.filter((id) => id !== challengeId),
            challenges: current.challenges.map((item) =>
              item.id === challengeId
                ? { ...item, participants: result.participants }
                : item,
            ),
            isOnline: true,
          }))
        } catch {
          set({
            joinedChallenges: wasJoined
              ? [...new Set([...get().joinedChallenges, challengeId])]
              : get().joinedChallenges.filter((id) => id !== challengeId),
            challenges: get().challenges.map((item) =>
              item.id === challengeId
                ? { ...item, participants: challenge?.participants ?? item.participants }
                : item,
            ),
            isOnline: false,
          })
          toast.error('Gagal memperbarui tantangan. Coba lagi.')
        }
      },

      toggleClub: async (clubId) => {
        const state = get()
        const wasJoined = state.joinedClubs.includes(clubId)
        const club = state.clubs.find((item) => item.id === clubId)

        set({
          joinedClubs: wasJoined
            ? state.joinedClubs.filter((id) => id !== clubId)
            : [...state.joinedClubs, clubId],
          clubs: state.clubs.map((item) =>
            item.id === clubId
              ? { ...item, members: Math.max(0, item.members + (wasJoined ? -1 : 1)) }
              : item,
          ),
        })

        try {
          const result = await api.toggleClub(clubId)
          set((current) => ({
            joinedClubs: result.joined
              ? [...new Set([...current.joinedClubs, clubId])]
              : current.joinedClubs.filter((id) => id !== clubId),
            clubs: current.clubs.map((item) =>
              item.id === clubId ? { ...item, members: result.members } : item,
            ),
            isOnline: true,
          }))
        } catch {
          set({
            joinedClubs: wasJoined
              ? [...new Set([...get().joinedClubs, clubId])]
              : get().joinedClubs.filter((id) => id !== clubId),
            clubs: get().clubs.map((item) =>
              item.id === clubId
                ? { ...item, members: club?.members ?? item.members }
                : item,
            ),
            isOnline: false,
          })
          toast.error('Gagal memperbarui klub. Coba lagi.')
        }
      },

      toggleFollow: async (userId) => {
        const state = get()
        const wasFollowing = state.following.includes(userId)

        set({
          following: wasFollowing
            ? state.following.filter((id) => id !== userId)
            : [...state.following, userId],
          user: {
            ...state.user,
            following: Math.max(0, state.user.following + (wasFollowing ? -1 : 1)),
          },
        })

        try {
          const result = await api.toggleFollow(userId)
          set({
            following: result.following
              ? [...new Set([...state.following, userId])]
              : state.following.filter((id) => id !== userId),
            user: result.user,
            isOnline: true,
          })
        } catch {
          set({
            following: state.following,
            user: state.user,
            isOnline: false,
          })
          toast.error('Gagal memperbarui daftar mengikuti. Coba lagi.')
        }
      },

      updateProfile: async (patch) => {
        const state = get()
        const previousUser = state.user
        const initials = patch.name
          ? patch.name
              .split(' ')
              .map((part) => part[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()
          : previousUser.initials
        const optimisticUser = { ...previousUser, ...patch, initials }

        set({
          user: optimisticUser,
          activities: state.activities.map((activity) =>
            activity.userId === optimisticUser.id
              ? {
                  ...activity,
                  userName: optimisticUser.name,
                  userInitials: optimisticUser.initials,
                  userColor: optimisticUser.color,
                }
              : activity,
          ),
          leaderboard: state.leaderboard.map((entry) =>
            entry.isCurrentUser
              ? { ...entry, name: optimisticUser.name, initials: optimisticUser.initials }
              : entry,
          ),
        })

        try {
          const result = await api.updateProfile(optimisticUser.id, patch)
          set({ user: result.user, isOnline: true })
          toast.success('Profil diperbarui di database')
        } catch {
          set({
            user: previousUser,
            activities: state.activities,
            leaderboard: state.leaderboard,
            isOnline: false,
          })
          toast.error('Gagal menyimpan profil. Coba lagi.')
        }
      },
    }),
    {
      name: 'gerakin-store',
      version: 2,
      partialize: (state) => ({ theme: state.theme }),
      migrate: (persistedState) => {
        const theme = (persistedState as { theme?: Theme } | undefined)?.theme
        return { theme: theme === 'light' ? 'light' : 'dark' }
      },
    },
  ),
)

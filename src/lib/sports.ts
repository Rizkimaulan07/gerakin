import {
  Bike,
  CircleDot,
  Dumbbell,
  Footprints,
  Mountain,
  PersonStanding,
  StretchHorizontal,
  Waves,
  type LucideIcon,
} from 'lucide-react'
import type { SportKey } from '@/types'

export interface SportMeta {
  key: SportKey
  label: string
  shortLabel: string
  icon: LucideIcon
  color: string
  bg: string
  supportsGps: boolean
}

export const SPORTS: Record<SportKey, SportMeta> = {
  run: {
    key: 'run',
    label: 'Lari',
    shortLabel: 'Lari',
    icon: Footprints,
    color: '#b6f240',
    bg: 'rgba(182, 242, 64, 0.12)',
    supportsGps: true,
  },
  ride: {
    key: 'ride',
    label: 'Sepeda',
    shortLabel: 'Sepeda',
    icon: Bike,
    color: '#52c7b8',
    bg: 'rgba(82, 199, 184, 0.12)',
    supportsGps: true,
  },
  walk: {
    key: 'walk',
    label: 'Jalan kaki',
    shortLabel: 'Jalan',
    icon: PersonStanding,
    color: '#f2c14e',
    bg: 'rgba(242, 193, 78, 0.12)',
    supportsGps: true,
  },
  hike: {
    key: 'hike',
    label: 'Hiking',
    shortLabel: 'Hiking',
    icon: Mountain,
    color: '#ff9a62',
    bg: 'rgba(255, 122, 69, 0.12)',
    supportsGps: true,
  },
  swim: {
    key: 'swim',
    label: 'Renang',
    shortLabel: 'Renang',
    icon: Waves,
    color: '#66b6ff',
    bg: 'rgba(102, 182, 255, 0.12)',
    supportsGps: false,
  },
  gym: {
    key: 'gym',
    label: 'Gym',
    shortLabel: 'Gym',
    icon: Dumbbell,
    color: '#9a8cff',
    bg: 'rgba(154, 140, 255, 0.12)',
    supportsGps: false,
  },
  football: {
    key: 'football',
    label: 'Futsal',
    shortLabel: 'Futsal',
    icon: CircleDot,
    color: '#ff8ea8',
    bg: 'rgba(255, 142, 168, 0.12)',
    supportsGps: false,
  },
  yoga: {
    key: 'yoga',
    label: 'Yoga',
    shortLabel: 'Yoga',
    icon: StretchHorizontal,
    color: '#c0b4ff',
    bg: 'rgba(192, 180, 255, 0.12)',
    supportsGps: false,
  },
}

export const SPORT_LIST = Object.values(SPORTS)
export const GPS_SPORTS: SportKey[] = ['run', 'ride', 'walk', 'hike']

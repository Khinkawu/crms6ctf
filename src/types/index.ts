import { Timestamp } from 'firebase/firestore'

export type Locale = 'th' | 'en'
export type Category = 'GEN' | 'CRYPTO' | 'WEB' | 'FOR' | 'REV' | 'MISC'
export type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Expert'
export type UserRole = 'student' | 'coach'

export interface Hint {
  text_th: string
  text_en: string
  penalty_pct: number
}

export interface Challenge {
  id: string
  title_th: string
  title_en: string
  description_th: string
  description_en: string
  category: Category
  difficulty: Difficulty
  base_points: number
  current_points: number
  flag_hash?: string
  solve_count: number
  first_blood_uid: string | null
  second_blood_uid: string | null
  third_blood_uid: string | null
  hints: Hint[]
  visible: boolean
  created_at: Timestamp | null
  attachment_url?: string
  writeup_th?: string
  writeup_en?: string
}

export interface Submission {
  id: string
  uid: string
  challenge_id: string
  correct: boolean
  points_awarded: number
  hint_penalty: number
  timestamp: Timestamp | null
}

export interface UserProfile {
  uid: string
  displayName: string
  email: string
  photoURL?: string
  total_points: number
  solved_challenges: string[]
  first_bloods: number
  hints_used: number
  hints_penalty_total: number
  first_solve_time: Timestamp | null
  language_pref: Locale
  role: UserRole
  created_at: Timestamp | null
}

export interface LeaderboardEntry {
  uid: string
  displayName: string
  photoURL?: string
  total_points: number
  solved_count: number
  first_bloods: number
  last_solve_time: Timestamp | null
}

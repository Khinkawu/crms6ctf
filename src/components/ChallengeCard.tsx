'use client'
import { useTranslations } from 'next-intl'
import { useRouter, useParams } from 'next/navigation'
import { Challenge } from '@/types'
import { CATEGORY_COLORS, DIFFICULTY_COLORS } from '@/lib/scoring'

interface Props {
  challenge: Challenge
  solved: boolean
  userId?: string
}

const CATEGORY_BG: Record<string, string> = {
  GEN:    'bg-blue-500/10',
  CRYPTO: 'bg-purple-500/10',
  WEB:    'bg-green-500/10',
  FOR:    'bg-orange-500/10',
  REV:    'bg-red-500/10',
  MISC:   'bg-gray-500/10',
}

const CATEGORY_GLOW: Record<string, string> = {
  GEN:    'hover:border-blue-500/60 hover:shadow-blue-500/10',
  CRYPTO: 'hover:border-purple-500/60 hover:shadow-purple-500/10',
  WEB:    'hover:border-green-500/60 hover:shadow-green-500/10',
  FOR:    'hover:border-orange-500/60 hover:shadow-orange-500/10',
  REV:    'hover:border-red-500/60 hover:shadow-red-500/10',
  MISC:   'hover:border-gray-500/60 hover:shadow-gray-500/10',
}

export default function ChallengeCard({ challenge, solved, userId }: Props) {
  const t = useTranslations('challenges')
  const { locale } = useParams()
  const router = useRouter()

  const title = locale === 'th' ? challenge.title_th : challenge.title_en
  const isFirstBlood  = challenge.first_blood_uid  === userId
  const isSecondBlood = challenge.second_blood_uid === userId
  const isThirdBlood  = challenge.third_blood_uid  === userId

  const glow = CATEGORY_GLOW[challenge.category] || 'hover:border-cyan-500/60 hover:shadow-cyan-500/10'
  const catBg = CATEGORY_BG[challenge.category] || 'bg-gray-500/10'

  return (
    <button
      onClick={() => router.push(`/${locale}/challenges/${challenge.id}`)}
      className={`w-full text-left rounded-xl p-4 transition-all duration-200 group relative overflow-hidden
        hover:shadow-lg hover:-translate-y-0.5
        ${solved
          ? 'bg-green-950/20 border border-green-800/60 hover:border-green-600/80'
          : `bg-gray-900/80 border ${glow} border-gray-700/60`
        }`}
    >
      {/* top color strip */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${catBg.replace('/10', '/60')} opacity-0 group-hover:opacity-100 transition-opacity`} />

      <div className="flex items-start justify-between gap-2 mb-3">
        <span className={`text-xs border px-2 py-0.5 rounded-md font-mono tracking-wider ${CATEGORY_COLORS[challenge.category] || 'text-gray-400 border-gray-600'}`}>
          {challenge.category}
        </span>
        <div className="flex items-center gap-1.5">
          {isFirstBlood  && <span className="text-xs font-bold text-red-400 bg-red-950/50 border border-red-800/50 px-1.5 py-0.5 rounded">🩸1st</span>}
          {isSecondBlood && <span className="text-xs font-bold text-orange-400 bg-orange-950/50 border border-orange-800/50 px-1.5 py-0.5 rounded">🩸2nd</span>}
          {isThirdBlood  && <span className="text-xs font-bold text-yellow-400 bg-yellow-950/50 border border-yellow-800/50 px-1.5 py-0.5 rounded">🩸3rd</span>}
          {solved && !isFirstBlood && !isSecondBlood && !isThirdBlood && (
            <span className="text-xs text-green-400 bg-green-950/50 border border-green-800/50 px-1.5 py-0.5 rounded">✓</span>
          )}
        </div>
      </div>

      <div className={`font-bold text-sm mb-3 leading-snug transition-colors line-clamp-2 ${
        solved ? 'text-green-300' : 'text-gray-100 group-hover:text-cyan-300'
      }`}>
        {title}
      </div>

      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium ${DIFFICULTY_COLORS[challenge.difficulty] || 'text-gray-400'}`}>
          {challenge.difficulty}
        </span>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-gray-500">{challenge.solve_count} {t('solves')}</span>
          <span className="text-cyan-400 font-bold tabular-nums">{challenge.current_points} pts</span>
        </div>
      </div>
    </button>
  )
}

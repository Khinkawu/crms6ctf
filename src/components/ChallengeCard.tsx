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

export default function ChallengeCard({ challenge, solved, userId }: Props) {
  const t = useTranslations('challenges')
  const { locale } = useParams()
  const router = useRouter()

  const title = locale === 'th' ? challenge.title_th : challenge.title_en
  const isFirstBlood = challenge.first_blood_uid === userId
  const isSecondBlood = challenge.second_blood_uid === userId
  const isThirdBlood = challenge.third_blood_uid === userId

  return (
    <button
      onClick={() => router.push(`/${locale}/challenges/${challenge.id}`)}
      className={`w-full text-left bg-gray-900 border rounded-lg p-4 hover:border-cyan-700 transition-all group ${
        solved ? 'border-green-800 bg-green-950/20' : 'border-gray-700'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className={`text-xs border px-2 py-0.5 rounded font-mono ${CATEGORY_COLORS[challenge.category] || 'text-gray-400 border-gray-600'}`}>
          {challenge.category}
        </span>
        <div className="flex items-center gap-1">
          {isFirstBlood && <span className="text-xs text-red-400">🩸1st</span>}
          {isSecondBlood && <span className="text-xs text-orange-400">🩸2nd</span>}
          {isThirdBlood && <span className="text-xs text-yellow-400">🩸3rd</span>}
          {solved && !isFirstBlood && !isSecondBlood && !isThirdBlood && (
            <span className="text-xs text-green-400">✓</span>
          )}
        </div>
      </div>

      <div className={`font-bold text-sm mb-1 group-hover:text-cyan-300 transition-colors ${solved ? 'text-green-300' : 'text-gray-100'}`}>
        {title}
      </div>

      <div className="flex items-center justify-between mt-3">
        <span className={`text-xs ${DIFFICULTY_COLORS[challenge.difficulty] || 'text-gray-400'}`}>
          {challenge.difficulty}
        </span>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>{challenge.solve_count} {t('solves')}</span>
          <span className="text-cyan-400 font-bold">{challenge.current_points} pts</span>
        </div>
      </div>
    </button>
  )
}

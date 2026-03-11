'use client'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useParams, useRouter } from 'next/navigation'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import FlagSubmitForm from '@/components/FlagSubmitForm'
import HintPanel from '@/components/HintPanel'
import { Challenge } from '@/types'
import { CATEGORY_COLORS, DIFFICULTY_COLORS } from '@/lib/scoring'

export default function ChallengePage() {
  const t = useTranslations('challenges')
  const tCommon = useTranslations('common')
  const { locale, id } = useParams() as { locale: string, id: string }
  const router = useRouter()
  const { user, profile, loading } = useAuth()
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [solved, setSolved] = useState(false)

  useEffect(() => {
    if (!id) return
    const unsub = onSnapshot(doc(db, 'challenges', id), snap => {
      if (snap.exists()) setChallenge({ id: snap.id, ...snap.data() } as Challenge)
    })
    return unsub
  }, [id])

  useEffect(() => {
    if (profile && challenge) setSolved(profile.solved_challenges.includes(challenge.id))
  }, [profile, challenge])

  if (!challenge) return (
    <div className="text-center py-20 text-gray-600">{tCommon('loading')}</div>
  )

  const title = locale === 'th' ? challenge.title_th : challenge.title_en
  const description = locale === 'th' ? challenge.description_th : challenge.description_en

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button onClick={() => router.push(`/${locale}/challenges`)} className="text-gray-500 hover:text-gray-300 text-sm">
        ← {tCommon('back')}
      </button>

      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-xs border px-2 py-0.5 rounded font-mono ${CATEGORY_COLORS[challenge.category]}`}>
            {challenge.category}
          </span>
          <span className={`text-xs ${DIFFICULTY_COLORS[challenge.difficulty]}`}>
            {challenge.difficulty}
          </span>
          {solved && <span className="text-xs text-green-400 border border-green-800 px-2 py-0.5 rounded">Solved ✓</span>}
        </div>

        <h1 className="text-xl font-bold text-gray-100">{title}</h1>

        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="text-cyan-400 font-bold text-lg">{challenge.current_points} pts</span>
          <span>{challenge.solve_count} {t('solves')}</span>
          {challenge.first_blood_uid && <span className="text-red-400">🩸 {t('first_blood')}</span>}
        </div>

        <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap border-t border-gray-800 pt-4">
          {description}
        </div>

        {challenge.attachment_url && (
          <a href={challenge.attachment_url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 border border-cyan-800 hover:border-cyan-600 px-3 py-1.5 rounded transition-colors">
            📎 {t('attachment')}
          </a>
        )}
      </div>

      {user && challenge.hints?.length > 0 && (
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
          <HintPanel challengeId={challenge.id} hints={challenge.hints} userId={user.uid} />
        </div>
      )}

      {user && profile ? (
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
          <FlagSubmitForm
            challenge={challenge}
            userId={user.uid}
            profile={profile}
            onSolved={() => setSolved(true)}
          />
        </div>
      ) : !loading && (
        <div className="text-center py-4 text-gray-500 text-sm">
          <button onClick={() => router.push(`/${locale}/auth`)} className="text-cyan-400 hover:underline">
            Login
          </button> to submit flags
        </div>
      )}
    </div>
  )
}

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
    return onSnapshot(doc(db, 'challenges', id), snap => {
      if (snap.exists()) setChallenge({ id: snap.id, ...snap.data() } as Challenge)
    })
  }, [id])

  useEffect(() => {
    if (profile && challenge) setSolved(profile.solved_challenges.includes(challenge.id))
  }, [profile, challenge])

  if (!challenge) return (
    <div className="flex items-center justify-center py-32 text-gray-600 font-mono text-sm">
      <span className="animate-pulse">▋</span>&nbsp;{tCommon('loading')}
    </div>
  )

  const title       = locale === 'th' ? challenge.title_th       : challenge.title_en
  const description = locale === 'th' ? challenge.description_th : challenge.description_en

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Back */}
      <button
        onClick={() => router.push(`/${locale}/challenges`)}
        className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-sm transition-colors group"
      >
        <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
        {tCommon('back')}
      </button>

      {/* Main card */}
      <div className={`rounded-xl p-6 space-y-5 border transition-colors ${
        solved
          ? 'bg-green-950/10 border-green-800/50'
          : 'bg-gray-900/80 border-gray-700/60'
      }`}>
        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-xs border px-2 py-0.5 rounded-md font-mono tracking-wider ${CATEGORY_COLORS[challenge.category]}`}>
            {challenge.category}
          </span>
          <span className={`text-xs font-medium ${DIFFICULTY_COLORS[challenge.difficulty]}`}>
            {challenge.difficulty}
          </span>
          {solved && (
            <span className="text-xs text-green-400 border border-green-700/60 bg-green-950/40 px-2 py-0.5 rounded-md">
              ✓ Solved
            </span>
          )}
        </div>

        {/* Title + stats */}
        <div>
          <h1 className="text-xl font-bold text-gray-100 mb-3 leading-snug">{title}</h1>
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-2xl font-bold text-cyan-400 tabular-nums">{challenge.current_points} pts</span>
            <span className="text-sm text-gray-500">{challenge.solve_count} {t('solves')}</span>
            {challenge.first_blood_uid && (
              <span className="text-sm text-red-400 flex items-center gap-1">🩸 {t('first_blood')}</span>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800" />

        {/* Description — overflow safe */}
        <div className="text-sm text-gray-300 leading-relaxed space-y-3">
          {description.split('\n').map((line, i) => {
            // Detect code-like lines (starts with spaces/tabs, or has backticks)
            const isCode = /^(\s{2,}|`|    |\t)/.test(line) || line.includes('`')
            if (isCode && line.trim()) {
              return (
                <code key={i} className="block bg-gray-800/80 border border-gray-700/50 rounded-md px-3 py-1.5 font-mono text-xs text-cyan-200 overflow-x-auto whitespace-pre">
                  {line}
                </code>
              )
            }
            return line.trim()
              ? <p key={i} className="break-words">{line}</p>
              : <div key={i} className="h-1" />
          })}
        </div>

        {/* Attachment */}
        {challenge.attachment_url && (
          <a
            href={challenge.attachment_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 border border-cyan-800/60 hover:border-cyan-600 bg-cyan-950/20 px-4 py-2 rounded-lg transition-all hover:bg-cyan-950/40"
          >
            📎 {t('attachment')}
          </a>
        )}
      </div>

      {/* Hints */}
      {user && challenge.hints?.length > 0 && (
        <div className="bg-gray-900/80 border border-gray-700/60 rounded-xl p-5">
          <HintPanel challengeId={challenge.id} hints={challenge.hints} userId={user.uid} />
        </div>
      )}

      {/* Submit */}
      {user && profile ? (
        <div className="bg-gray-900/80 border border-gray-700/60 rounded-xl p-5">
          <h3 className="text-xs text-gray-500 uppercase tracking-widest font-mono mb-3">Submit Flag</h3>
          <FlagSubmitForm
            challenge={challenge}
            userId={user.uid}
            profile={profile}
            onSolved={() => setSolved(true)}
          />
        </div>
      ) : !loading && (
        <div className="text-center py-5 bg-gray-900/50 border border-gray-800 rounded-xl text-sm text-gray-500">
          <button
            onClick={() => router.push(`/${locale}/auth`)}
            className="text-cyan-400 hover:text-cyan-300 hover:underline transition-colors"
          >
            Login
          </button>
          {' '}to submit flags
        </div>
      )}
    </div>
  )
}

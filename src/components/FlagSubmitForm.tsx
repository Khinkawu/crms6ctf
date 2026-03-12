'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { db } from '@/lib/firebase'
import {
  doc, addDoc, collection,
  increment, serverTimestamp, runTransaction
} from 'firebase/firestore'
import { Challenge, UserProfile } from '@/types'
import { calculateCurrentPoints, getBloodBonus } from '@/lib/scoring'

interface Props {
  challenge: Challenge
  userId: string
  profile: UserProfile
  onSolved: (points: number) => void
  locale?: string
}

export default function FlagSubmitForm({ challenge, userId, profile, onSolved, locale = 'th' }: Props) {
  const t = useTranslations('challenges')
  const [input, setInput] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'correct' | 'wrong' | 'already'>('idle')
  const [pointsAwarded, setPointsAwarded] = useState(0)
  const writeup = locale === 'th' ? challenge.writeup_th : challenge.writeup_en

  const alreadySolved = profile.solved_challenges.includes(challenge.id)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (alreadySolved) { setStatus('already'); return }
    setStatus('loading')

    // Server-side flag validation — flag_hash never sent to client
    const res = await fetch('/api/verify-flag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeId: challenge.id, flag: input }),
    })
    const { correct } = await res.json()

    if (!correct) {
      await addDoc(collection(db, 'submissions'), {
        uid: userId, challenge_id: challenge.id,
        correct: false, points_awarded: 0, hint_penalty: 0,
        timestamp: serverTimestamp(),
      })
      setStatus('wrong')
      return
    }

    try {
      let awarded = 0
      await runTransaction(db, async (tx) => {
        const chalRef = doc(db, 'challenges', challenge.id)
        const userRef = doc(db, 'users', userId)
        const chalSnap = await tx.get(chalRef)
        const userSnap = await tx.get(userRef)
        const chal = chalSnap.data() as Challenge
        const user = userSnap.data() as UserProfile

        const newSolveCount = (chal.solve_count || 0) + 1
        const current = calculateCurrentPoints(chal.base_points, newSolveCount)
        const blood = getBloodBonus(newSolveCount)

        const hintsSnap = await tx.get(doc(db, 'hints_used', `${userId}_${challenge.id}`))
        const hintPenaltyPct = hintsSnap.exists() ? (hintsSnap.data().penalty_pct || 0) : 0
        const penalty = Math.floor(current * (hintPenaltyPct / 100))
        awarded = Math.max(1, current + blood - penalty)

        const updates: Record<string, any> = {
          solve_count: newSolveCount,
          current_points: calculateCurrentPoints(chal.base_points, newSolveCount + 1),
        }
        if (newSolveCount === 1) updates.first_blood_uid = userId
        if (newSolveCount === 2) updates.second_blood_uid = userId
        if (newSolveCount === 3) updates.third_blood_uid = userId
        tx.update(chalRef, updates)

        tx.update(userRef, {
          total_points: increment(awarded),
          solved_challenges: [...(user.solved_challenges || []), challenge.id],
          first_bloods: increment(newSolveCount === 1 ? 1 : 0),
          hints_penalty_total: increment(Math.floor(current * (hintPenaltyPct / 100))),
          first_solve_time: user.first_solve_time || serverTimestamp(),
          last_solve_time: serverTimestamp(),
        })

        // Submission inside transaction for atomicity
        const subRef = doc(collection(db, 'submissions'))
        tx.set(subRef, {
          uid: userId, challenge_id: challenge.id,
          correct: true, points_awarded: awarded, hint_penalty: penalty,
          timestamp: serverTimestamp(),
        })
      })

      setPointsAwarded(awarded)
      setStatus('correct')
      onSolved(awarded)
    } catch {
      setStatus('wrong')
    }
  }

  if (alreadySolved || status === 'correct') {
    return (
      <div className="space-y-4">
        <div className="bg-green-950/30 border border-green-800/60 rounded-lg p-4 text-center">
          <div className="text-green-400 font-bold text-sm">
            {status === 'correct'
              ? t('flag_correct', { points: pointsAwarded })
              : t('flag_already_solved')
            }
          </div>
        </div>
        {writeup && (
          <div className="space-y-2">
            <h3 className="text-xs text-green-400 uppercase tracking-widest font-mono">✓ Writeup</h3>
            <div className="text-sm text-gray-300 leading-relaxed space-y-2">
              {writeup.split('\n').map((line, i) =>
                line.trim()
                  ? <p key={i} className="break-words">{line}</p>
                  : <div key={i} className="h-1" />
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={t('flag_placeholder')}
          className="flex-1 bg-gray-800 border border-gray-600 focus:border-cyan-500 rounded-lg px-3 py-2 text-sm font-mono text-gray-100 outline-none transition-colors"
          disabled={status === 'loading'}
        />
        <button
          type="submit"
          disabled={status === 'loading' || !input.trim()}
          className="bg-cyan-500 hover:bg-cyan-400 disabled:bg-gray-700 disabled:text-gray-500 text-gray-950 font-bold px-4 py-2 rounded-lg transition-colors text-sm"
        >
          {status === 'loading' ? '...' : t('submit_flag')}
        </button>
      </div>
      {status === 'wrong' && (
        <p className="text-red-400 text-sm">{t('flag_wrong')}</p>
      )}
    </form>
  )
}

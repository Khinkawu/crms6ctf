'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { hashFlag } from '@/lib/flag'
import { db } from '@/lib/firebase'
import {
  doc, getDoc, addDoc, collection,
  increment, serverTimestamp, runTransaction
} from 'firebase/firestore'
import { Challenge, UserProfile } from '@/types'
import { calculateCurrentPoints, getBloodBonus } from '@/lib/scoring'

interface Props {
  challenge: Challenge
  userId: string
  profile: UserProfile
  onSolved: (points: number) => void
}

export default function FlagSubmitForm({ challenge, userId, profile, onSolved }: Props) {
  const t = useTranslations('challenges')
  const [input, setInput] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'correct' | 'wrong' | 'already'>('idle')
  const [pointsAwarded, setPointsAwarded] = useState(0)

  const alreadySolved = profile.solved_challenges.includes(challenge.id)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (alreadySolved) { setStatus('already'); return }
    setStatus('loading')

    const inputHash = await hashFlag(input)
    if (inputHash !== challenge.flag_hash) {
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
      })

      await addDoc(collection(db, 'submissions'), {
        uid: userId, challenge_id: challenge.id,
        correct: true, points_awarded: awarded, hint_penalty: 0,
        timestamp: serverTimestamp(),
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
      <div className="bg-green-950/30 border border-green-800 rounded-lg p-4 text-center">
        <div className="text-green-400 font-bold">
          {status === 'correct'
            ? t('flag_correct', { points: pointsAwarded })
            : t('flag_already_solved')
          }
        </div>
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

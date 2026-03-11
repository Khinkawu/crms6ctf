'use client'
import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { db } from '@/lib/firebase'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { Hint } from '@/types'

interface Props {
  challengeId: string
  hints: Hint[]
  userId: string
}

export default function HintPanel({ challengeId, hints, userId }: Props) {
  const t = useTranslations('challenges')
  const locale = useLocale()
  const [unlockedIdxs, setUnlockedIdxs] = useState<number[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const snap = await getDoc(doc(db, 'hints_used', `${userId}_${challengeId}`))
      if (snap.exists()) setUnlockedIdxs(snap.data().unlocked || [])
      setLoading(false)
    }
    load()
  }, [userId, challengeId])

  async function unlockHint(hint: Hint, index: number) {
    if (unlockedIdxs.includes(index)) return
    const newUnlocked = [...unlockedIdxs, index]
    const totalPenalty = hints
      .filter((_, i) => newUnlocked.includes(i))
      .reduce((sum, h) => sum + h.penalty_pct, 0)
    setUnlockedIdxs(newUnlocked)
    await setDoc(doc(db, 'hints_used', `${userId}_${challengeId}`), {
      uid: userId,
      challenge_id: challengeId,
      unlocked: newUnlocked,
      penalty_pct: totalPenalty,
      updated_at: serverTimestamp(),
    }, { merge: true })
  }

  if (loading || hints.length === 0) return null

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">{t('hints')}</h3>
      {hints.map((hint, i) => {
        const isUnlocked = unlockedIdxs.includes(i)
        const text = locale === 'th' ? hint.text_th : hint.text_en
        return (
          <div key={i} className={`border rounded-lg p-3 transition-all ${
            isUnlocked ? 'border-yellow-800 bg-yellow-950/20' : 'border-gray-700 bg-gray-900'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Hint {i + 1}</span>
              <span className={`text-xs ${hint.penalty_pct === 0 ? 'text-green-400' : 'text-yellow-400'}`}>
                {hint.penalty_pct === 0 ? t('hint_free') : t('hint_cost', { pct: hint.penalty_pct })}
              </span>
            </div>
            {isUnlocked ? (
              <p className="text-sm text-yellow-200 mt-2">{text}</p>
            ) : (
              <button
                onClick={() => unlockHint(hint, i)}
                className="mt-2 text-xs text-cyan-400 hover:text-cyan-300 underline transition-colors"
              >
                {t('hint_unlock')}
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

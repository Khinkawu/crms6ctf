'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { Category, Difficulty, Hint } from '@/types'
import { DIFFICULTY_BASE_POINTS } from '@/lib/scoring'
import ChallengeForm from '@/components/ChallengeForm'

export default function NewChallengePage() {
  const { locale } = useParams()
  const router = useRouter()
  const { profile } = useAuth()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  if (profile?.role !== 'coach') return null

  const handleSubmit = async (data: {
    title_th: string; title_en: string
    description_th: string; description_en: string
    category: Category; difficulty: Difficulty
    flag_plain: string; hints: Hint[]
    visible: boolean; attachment_url: string
    solution_th: string
  }) => {
    setSaving(true)
    setError('')
    try {
      const { flag_plain, ...rest } = data
      const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(flag_plain))
      const flag_hash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
      const base_points = DIFFICULTY_BASE_POINTS[data.difficulty]
      await addDoc(collection(db, 'challenges'), {
        ...rest,
        flag_hash,
        base_points,
        current_points: base_points,
        solve_count: 0,
        first_blood_uid: null,
        second_blood_uid: null,
        third_blood_uid: null,
        created_at: serverTimestamp(),
      })
      router.push(`/${locale}/coach`)
    } catch (e: any) {
      setError(e.message)
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-300 text-sm">← กลับ</button>
        <h1 className="text-xl font-bold text-cyan-400">เพิ่มโจทย์ใหม่</h1>
      </div>
      {error && <div className="bg-red-900/30 border border-red-700 text-red-400 rounded-lg p-3 text-sm">{error}</div>}
      <ChallengeForm onSubmit={handleSubmit} saving={saving} />
    </div>
  )
}

'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { Category, Difficulty, Hint, Challenge } from '@/types'
import { DIFFICULTY_BASE_POINTS } from '@/lib/scoring'
import ChallengeForm from '@/components/ChallengeForm'

export default function EditChallengePage() {
  const { locale, id } = useParams()
  const router = useRouter()
  const { profile } = useAuth()
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id || typeof id !== 'string') return
    getDoc(doc(db, 'challenges', id)).then(snap => {
      if (snap.exists()) setChallenge({ id: snap.id, ...snap.data() } as Challenge)
    })
  }, [id])

  if (profile?.role !== 'coach') return null
  if (!challenge) return <div className="text-gray-500 text-center py-16">กำลังโหลด...</div>

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
      const updates: Record<string, any> = { ...data }
      if (data.flag_plain) {
        const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data.flag_plain))
        updates.flag_hash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
      }
      delete updates.flag_plain
      if (data.difficulty !== challenge.difficulty) {
        updates.base_points = DIFFICULTY_BASE_POINTS[data.difficulty]
        updates.current_points = DIFFICULTY_BASE_POINTS[data.difficulty]
      }
      await updateDoc(doc(db, 'challenges', challenge.id), updates)
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
        <h1 className="text-xl font-bold text-cyan-400">แก้ไขโจทย์</h1>
      </div>
      {error && <div className="bg-red-900/30 border border-red-700 text-red-400 rounded-lg p-3 text-sm">{error}</div>}
      <ChallengeForm challenge={challenge} onSubmit={handleSubmit} saving={saving} />
    </div>
  )
}

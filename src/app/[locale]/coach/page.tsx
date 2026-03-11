'use client'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, useParams } from 'next/navigation'
import { collection, onSnapshot, doc, updateDoc, deleteDoc, orderBy, query } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { Challenge } from '@/types'
import { CATEGORY_COLORS, DIFFICULTY_COLORS } from '@/lib/scoring'

export default function CoachPage() {
  const t = useTranslations()
  const { locale } = useParams()
  const router = useRouter()
  const { profile, loading } = useAuth()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && profile?.role !== 'coach') {
      router.replace(`/${locale}`)
    }
  }, [profile, loading, locale, router])

  useEffect(() => {
    if (profile?.role !== 'coach') return
    const q = query(collection(db, 'challenges'), orderBy('created_at', 'desc'))
    return onSnapshot(q, snap => {
      setChallenges(snap.docs.map(d => ({ id: d.id, ...d.data() } as Challenge)))
    }, () => {})
  }, [profile])

  const toggleVisible = async (c: Challenge) => {
    await updateDoc(doc(db, 'challenges', c.id), { visible: !c.visible })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('ลบโจทย์นี้?')) return
    setDeleting(id)
    await deleteDoc(doc(db, 'challenges', id))
    setDeleting(null)
  }

  if (loading || profile?.role !== 'coach') return null

  const visible = challenges.filter(c => c.visible).length
  const totalSolves = challenges.reduce((s, c) => s + c.solve_count, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-cyan-400">{t('coach.title')}</h1>
        <button
          onClick={() => router.push(`/${locale}/coach/challenges/new`)}
          className="bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold px-4 py-2 rounded-lg text-sm transition-colors"
        >
          + {t('coach.add_challenge')}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'โจทย์ทั้งหมด', value: challenges.length },
          { label: 'เปิดแสดง', value: visible },
          { label: 'Solves ทั้งหมด', value: totalSolves },
          { label: 'ซ่อนอยู่', value: challenges.length - visible },
        ].map(({ label, value }) => (
          <div key={label} className="bg-gray-900 border border-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-cyan-400">{value}</div>
            <div className="text-gray-400 text-xs mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Challenge list */}
      <div className="space-y-2">
        {challenges.length === 0 && (
          <div className="text-center py-16 text-gray-600">ยังไม่มีโจทย์ — กด + เพิ่มโจทย์</div>
        )}
        {challenges.map(c => (
          <div
            key={c.id}
            className={`bg-gray-900 border rounded-lg p-4 flex items-center gap-4 transition-opacity ${
              c.visible ? 'border-gray-700' : 'border-gray-800 opacity-60'
            }`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded font-mono ${CATEGORY_COLORS[c.category]}`}>
                  {c.category}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded ${DIFFICULTY_COLORS[c.difficulty]}`}>
                  {c.difficulty}
                </span>
                {!c.visible && (
                  <span className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-500">ซ่อน</span>
                )}
              </div>
              <div className="mt-1 font-medium text-gray-100 truncate">
                {locale === 'th' ? c.title_th : c.title_en}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {c.current_points} pts · {c.solve_count} solves
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => toggleVisible(c)}
                title={t('coach.toggle_visible')}
                className={`text-xs px-3 py-1.5 rounded border transition-colors ${
                  c.visible
                    ? 'border-green-700 text-green-400 hover:bg-green-900/30'
                    : 'border-gray-600 text-gray-500 hover:border-gray-400 hover:text-gray-300'
                }`}
              >
                {c.visible ? 'เปิด' : 'ปิด'}
              </button>
              <button
                onClick={() => router.push(`/${locale}/coach/challenges/${c.id}/edit`)}
                className="text-xs px-3 py-1.5 rounded border border-gray-600 text-gray-400 hover:border-cyan-400 hover:text-cyan-400 transition-colors"
              >
                แก้ไข
              </button>
              <button
                onClick={() => handleDelete(c.id)}
                disabled={deleting === c.id}
                className="text-xs px-3 py-1.5 rounded border border-gray-700 text-red-500 hover:border-red-700 hover:bg-red-900/20 transition-colors disabled:opacity-40"
              >
                {deleting === c.id ? '...' : 'ลบ'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

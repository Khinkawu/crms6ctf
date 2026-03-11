'use client'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import ChallengeCard from '@/components/ChallengeCard'
import { Challenge, Category, Difficulty } from '@/types'

const CATEGORIES: (Category | 'ALL')[] = ['ALL', 'GEN', 'CRYPTO', 'WEB', 'FOR', 'REV', 'MISC']
const DIFFICULTIES: (Difficulty | 'ALL')[] = ['ALL', 'Easy', 'Medium', 'Hard', 'Expert']

export default function ChallengesPage() {
  const t = useTranslations('challenges')
  const { locale } = useParams()
  const { user, profile } = useAuth()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [catFilter, setCatFilter] = useState<Category | 'ALL'>('ALL')
  const [diffFilter, setDiffFilter] = useState<Difficulty | 'ALL'>('ALL')

  useEffect(() => {
    const q = query(collection(db, 'challenges'), where('visible', '==', true))
    const unsub = onSnapshot(q, snap => {
      setChallenges(snap.docs.map(d => ({ id: d.id, ...d.data() } as Challenge)))
    })
    return unsub
  }, [])

  const filtered = challenges.filter(c => {
    if (catFilter !== 'ALL' && c.category !== catFilter) return false
    if (diffFilter !== 'ALL' && c.difficulty !== diffFilter) return false
    return true
  })

  const solvedIds = profile?.solved_challenges || []

  const FilterBtn = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`text-xs px-3 py-1 rounded-full border transition-colors ${
        active ? 'border-cyan-400 text-cyan-400 bg-cyan-950/30' : 'border-gray-700 text-gray-400 hover:border-gray-500'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-cyan-400">{t('title')}</h1>
        <span className="text-xs text-gray-500">{filtered.length} challenges</span>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(c => (
            <FilterBtn key={c} label={c === 'ALL' ? t('filter_all') : c} active={catFilter === c} onClick={() => setCatFilter(c)} />
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {DIFFICULTIES.map(d => (
            <FilterBtn key={d} label={d === 'ALL' ? t('filter_all') : d} active={diffFilter === d} onClick={() => setDiffFilter(d)} />
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-600">{t('no_challenges')}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => (
            <ChallengeCard key={c.id} challenge={c} solved={solvedIds.includes(c.id)} userId={user?.uid} />
          ))}
        </div>
      )}
    </div>
  )
}

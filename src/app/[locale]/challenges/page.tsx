'use client'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import ChallengeCard from '@/components/ChallengeCard'
import { Challenge, Category, Difficulty } from '@/types'
import { CATEGORY_COLORS } from '@/lib/scoring'

const CATEGORIES: (Category | 'ALL')[] = ['ALL', 'GEN', 'CRYPTO', 'WEB', 'FOR', 'REV', 'MISC']
const DIFFICULTIES: (Difficulty | 'ALL')[] = ['ALL', 'Easy', 'Medium', 'Hard', 'Expert']

const DIFF_COLORS: Record<string, string> = {
  Easy:   'text-green-400 border-green-700 data-[active=true]:bg-green-950/50 data-[active=true]:border-green-500',
  Medium: 'text-yellow-400 border-yellow-700 data-[active=true]:bg-yellow-950/50 data-[active=true]:border-yellow-500',
  Hard:   'text-orange-400 border-orange-700 data-[active=true]:bg-orange-950/50 data-[active=true]:border-orange-500',
  Expert: 'text-red-400 border-red-700 data-[active=true]:bg-red-950/50 data-[active=true]:border-red-500',
  ALL:    'text-gray-400 border-gray-700 data-[active=true]:bg-gray-800 data-[active=true]:border-gray-500',
}

export default function ChallengesPage() {
  const t = useTranslations('challenges')
  const { locale } = useParams()
  const { user, profile } = useAuth()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [catFilter, setCatFilter]   = useState<Category | 'ALL'>('ALL')
  const [diffFilter, setDiffFilter] = useState<Difficulty | 'ALL'>('ALL')

  useEffect(() => {
    const q = query(collection(db, 'challenges'), where('visible', '==', true))
    return onSnapshot(q, snap => {
      setChallenges(snap.docs.map(d => ({ id: d.id, ...d.data() } as Challenge)))
    })
  }, [])

  const filtered = challenges.filter(c => {
    if (catFilter  !== 'ALL' && c.category   !== catFilter)  return false
    if (diffFilter !== 'ALL' && c.difficulty !== diffFilter) return false
    return true
  })

  const solvedIds = profile?.solved_challenges || []
  const solvedCount = filtered.filter(c => solvedIds.includes(c.id)).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-cyan-400 tracking-wide">{t('title')}</h1>
          <p className="text-xs text-gray-500 mt-1">
            {solvedCount}/{filtered.length} solved
          </p>
        </div>

        {/* Progress bar */}
        <div className="hidden sm:block w-48">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Progress</span>
            <span>{filtered.length > 0 ? Math.round((solvedCount / filtered.length) * 100) : 0}%</span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-500 rounded-full transition-all"
              style={{ width: filtered.length > 0 ? `${(solvedCount / filtered.length) * 100}%` : '0%' }}
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 space-y-3">
        {/* Category */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(c => {
            const isAll = c === 'ALL'
            const active = catFilter === c
            const colorClass = isAll
              ? `text-gray-400 border-gray-700 ${active ? 'bg-gray-800 border-gray-500 text-gray-200' : 'hover:border-gray-600'}`
              : `${CATEGORY_COLORS[c] || 'text-gray-400 border-gray-600'} ${active ? 'bg-gray-800' : 'opacity-60 hover:opacity-100'}`
            return (
              <button
                key={c}
                onClick={() => setCatFilter(c)}
                className={`text-xs px-3 py-1 rounded-md border font-mono tracking-wider transition-all ${colorClass}`}
              >
                {isAll ? t('filter_all') : c}
              </button>
            )
          })}
        </div>

        {/* Difficulty */}
        <div className="flex flex-wrap gap-2">
          {DIFFICULTIES.map(d => {
            const active = diffFilter === d
            const colorClass = DIFF_COLORS[d] || DIFF_COLORS.ALL
            return (
              <button
                key={d}
                data-active={active}
                onClick={() => setDiffFilter(d)}
                className={`text-xs px-3 py-1 rounded-md border transition-all ${colorClass} ${
                  !active ? 'opacity-60 hover:opacity-100' : ''
                }`}
              >
                {d === 'ALL' ? t('filter_all') : d}
              </button>
            )
          })}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-600 font-mono">
          <div className="text-4xl mb-3">⚠</div>
          {t('no_challenges')}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(c => (
            <ChallengeCard key={c.id} challenge={c} solved={solvedIds.includes(c.id)} userId={user?.uid} />
          ))}
        </div>
      )}
    </div>
  )
}

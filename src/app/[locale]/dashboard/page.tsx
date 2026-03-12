'use client'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useParams, useRouter } from 'next/navigation'
import { collection, query, where, orderBy, limit, onSnapshot, getDocs, getCountFromServer } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { Submission } from '@/types'

export default function DashboardPage() {
  const t = useTranslations('dashboard')
  const tCommon = useTranslations('common')
  const { locale } = useParams()
  const router = useRouter()
  const { user, profile, loading } = useAuth()
  const [recentSubs, setRecentSubs] = useState<(Submission & { title?: string })[]>([])
  const [rank, setRank] = useState<number | null>(null)
  const [totalPlayers, setTotalPlayers] = useState(0)

  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'submissions'),
      where('uid', '==', user.uid),
      where('correct', '==', true),
      orderBy('timestamp', 'desc'),
      limit(5)
    )
    const unsub = onSnapshot(q, async snap => {
      const subs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Submission))
      const enriched = await Promise.all(subs.map(async s => {
        try {
          const chalSnap = await getDocs(query(collection(db, 'challenges'), where('__name__', '==', s.challenge_id)))
          const data = chalSnap.docs[0]?.data()
          const title = data?.[locale === 'th' ? 'title_th' : 'title_en'] || s.challenge_id
          return { ...s, title }
        } catch { return s }
      }))
      setRecentSubs(enriched)
    })
    return unsub
  }, [user, locale])

  useEffect(() => {
    if (!user || !profile) return
    async function calcRank() {
      const snap = await getCountFromServer(query(collection(db, 'users'), where('total_points', '>', profile!.total_points)))
      setRank(snap.data().count + 1)
      const total = await getCountFromServer(collection(db, 'users'))
      setTotalPlayers(total.data().count)
    }
    calcRank()
  }, [profile])

  if (loading) return <div className="text-center py-20 text-gray-600">{tCommon('loading')}</div>
  if (!user || !profile) {
    router.push(`/${locale}/auth`)
    return null
  }

  const StatCard = ({ label, value, sub }: { label: string, value: string | number, sub?: string }) => (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-1">
      <div className="text-xs text-gray-400 uppercase tracking-wider">{label}</div>
      <div className="text-2xl font-bold text-cyan-400">{value}</div>
      {sub && <div className="text-xs text-gray-500">{sub}</div>}
    </div>
  )

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-cyan-800 flex items-center justify-center text-xl text-cyan-200 font-bold">
          {profile.displayName[0]?.toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-100">{profile.displayName}</h1>
          <p className="text-xs text-gray-500">{profile.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label={t('total_points')} value={profile.total_points} />
        <StatCard label={t('rank')} value={rank ? `#${rank}` : '-'} sub={`of ${totalPlayers}`} />
        <StatCard label={t('solved')} value={profile.solved_challenges.length} />
        <StatCard label={t('first_bloods')} value={profile.first_bloods > 0 ? `🩸 ${profile.first_bloods}` : '-'} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <StatCard label={t('hints_used')} value={profile.hints_used} />
        <StatCard label={t('hints_penalty')} value={`-${profile.hints_penalty_total} pts`} />
      </div>

      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-3">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">{t('recent_activity')}</h2>
        {recentSubs.length === 0 ? (
          <p className="text-gray-600 text-sm">{t('no_activity')}</p>
        ) : recentSubs.map((s, i) => (
          <div key={i} className="flex items-center justify-between text-sm border-b border-gray-800 pb-2 last:border-0">
            <span className="text-gray-300 truncate">✓ {s.title}</span>
            <span className="text-cyan-400 font-bold shrink-0 ml-2">+{s.points_awarded}</span>
          </div>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">{t('settings')}</h2>
        <button
          onClick={() => router.push(`/${locale}/dashboard/settings`)}
          className="text-sm text-cyan-400 hover:text-cyan-300 underline"
        >
          {t('change_password')}
        </button>
      </div>
    </div>
  )
}

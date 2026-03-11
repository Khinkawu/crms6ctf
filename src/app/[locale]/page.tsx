'use client'
import { useTranslations } from 'next-intl'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { collection, getCountFromServer, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export default function HomePage() {
  const t = useTranslations()
  const router = useRouter()
  const { locale } = useParams()
  const [stats, setStats] = useState({ challenges: 0, players: 0, categories: 6 })

  useEffect(() => {
    async function loadStats() {
      try {
        const [cSnap, uSnap] = await Promise.all([
          getCountFromServer(query(collection(db, 'challenges'), where('visible', '==', true))),
          getCountFromServer(collection(db, 'users')),
        ])
        setStats(s => ({ ...s, challenges: cSnap.data().count, players: uSnap.data().count }))
      } catch { /* rules not ready or unauthenticated — show defaults */ }
    }
    loadStats()
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center gap-8">
      <div className="space-y-4">
        <div className="text-5xl font-bold text-cyan-400 tracking-widest">
          {t('home.title')}
        </div>
        <p className="text-gray-400 max-w-xl text-sm leading-relaxed">
          {t('home.subtitle')}
        </p>
      </div>

      <pre className="text-cyan-900 text-xs hidden md:block select-none leading-tight">{`
  ██████╗████████╗███████╗
 ██╔════╝╚══██╔══╝██╔════╝
 ██║        ██║   █████╗
 ██║        ██║   ██╔══╝
 ╚██████╗   ██║   ██║
  ╚═════╝   ╚═╝   ╚═╝     `}</pre>

      <div className="grid grid-cols-3 gap-6">
        {[
          { label: t('home.stats_challenges'), value: stats.challenges },
          { label: t('home.stats_players'), value: stats.players },
          { label: t('home.stats_categories'), value: stats.categories },
        ].map(({ label, value }) => (
          <div key={label} className="bg-gray-900 border border-gray-700 rounded-lg p-4 min-w-[90px]">
            <div className="text-3xl font-bold text-cyan-400">{value}</div>
            <div className="text-gray-400 text-xs mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => router.push(`/${locale}/challenges`)}
          className="bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold px-6 py-3 rounded-lg transition-colors text-sm"
        >
          {t('home.start')}
        </button>
        <button
          onClick={() => router.push(`/${locale}/leaderboard`)}
          className="border border-gray-600 hover:border-cyan-400 text-gray-300 hover:text-cyan-400 px-6 py-3 rounded-lg transition-colors text-sm"
        >
          {t('home.leaderboard')}
        </button>
      </div>
    </div>
  )
}

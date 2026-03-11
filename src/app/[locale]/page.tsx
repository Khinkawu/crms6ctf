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
      } catch { /* unauthenticated — show defaults */ }
    }
    loadStats()
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-[76vh] text-center gap-10 px-4">

      {/* ASCII logo */}
      <pre className="text-cyan-900 text-[10px] sm:text-xs hidden sm:block select-none leading-none">{`
  ██████╗██████╗ ███╗   ███╗███████╗ ██████╗      ██████╗████████╗███████╗
 ██╔════╝██╔══██╗████╗ ████║██╔════╝██╔════╝     ██╔════╝╚══██╔══╝██╔════╝
 ██║     ██████╔╝██╔████╔██║███████╗███████╗█████╗██║        ██║   █████╗
 ██║     ██╔══██╗██║╚██╔╝██║╚════██║██╔═══╝╚════╝██║        ██║   ██╔══╝
 ╚██████╗██║  ██║██║ ╚═╝ ██║███████║╚██████╗     ╚██████╗   ██║   ██║
  ╚═════╝╚═╝  ╚═╝╚═╝     ╚═╝╚══════╝ ╚═════╝      ╚═════╝   ╚═╝   ╚═╝`}</pre>

      {/* Headline */}
      <div className="space-y-3">
        <h1 className="text-4xl sm:text-5xl font-bold text-cyan-400 tracking-widest drop-shadow-[0_0_20px_rgba(34,211,238,0.3)]">
          {t('home.title')}
        </h1>
        <p className="text-gray-400 max-w-lg text-sm leading-relaxed">
          {t('home.subtitle')}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 sm:gap-6">
        {[
          { label: t('home.stats_challenges'), value: stats.challenges, color: 'text-cyan-400' },
          { label: t('home.stats_players'),    value: stats.players,    color: 'text-green-400' },
          { label: t('home.stats_categories'), value: stats.categories, color: 'text-purple-400' },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="bg-gray-900/80 border border-gray-700/60 rounded-xl p-4 sm:p-6 min-w-[80px] sm:min-w-[110px] hover:border-gray-600 transition-colors"
          >
            <div className={`text-3xl sm:text-4xl font-bold tabular-nums ${color}`}>{value}</div>
            <div className="text-gray-500 text-xs mt-1.5">{label}</div>
          </div>
        ))}
      </div>

      {/* CTA buttons */}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-none sm:w-auto">
        <button
          onClick={() => router.push(`/${locale}/challenges`)}
          className="bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold px-8 py-3 rounded-xl transition-all hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:-translate-y-0.5 text-sm tracking-wide"
        >
          {t('home.start')} →
        </button>
        <button
          onClick={() => router.push(`/${locale}/leaderboard`)}
          className="border border-gray-600 hover:border-cyan-500/60 text-gray-300 hover:text-cyan-400 px-8 py-3 rounded-xl transition-all hover:-translate-y-0.5 text-sm"
        >
          {t('home.leaderboard')}
        </button>
      </div>
    </div>
  )
}

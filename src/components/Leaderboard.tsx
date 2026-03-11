'use client'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { LeaderboardEntry } from '@/types'
import { useAuth } from '@/hooks/useAuth'

export default function Leaderboard() {
  const t = useTranslations('leaderboard')
  const { user } = useAuth()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('total_points', 'desc'), limit(50))
    const unsub = onSnapshot(q, snap => {
      setEntries(snap.docs.map(d => ({
        uid: d.id,
        displayName: d.data().displayName || 'Anonymous',
        photoURL: d.data().photoURL,
        total_points: d.data().total_points || 0,
        solved_count: (d.data().solved_challenges || []).length,
        first_bloods: d.data().first_bloods || 0,
        last_solve_time: d.data().last_solve_time || null,
      })))
    })
    return unsub
  }, [])

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-cyan-400">{t('title')}</h1>
      <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700 text-gray-400 text-xs uppercase">
              <th className="text-left px-4 py-3 w-12">{t('rank')}</th>
              <th className="text-left px-4 py-3">{t('player')}</th>
              <th className="text-right px-4 py-3">{t('solved')}</th>
              <th className="text-right px-4 py-3 hidden sm:table-cell">{t('first_bloods')}</th>
              <th className="text-right px-4 py-3">{t('points')}</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-10 text-gray-600">{t('empty')}</td></tr>
            ) : entries.map((e, i) => (
              <tr
                key={e.uid}
                className={`border-b border-gray-800 transition-colors ${
                  e.uid === user?.uid ? 'bg-cyan-950/30' : 'hover:bg-gray-800/50'
                }`}
              >
                <td className="px-4 py-3 font-mono">
                  {i < 3 ? medals[i] : <span className="text-gray-500">#{i + 1}</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-cyan-800 flex items-center justify-center text-xs text-cyan-200 font-bold shrink-0">
                      {e.displayName[0]?.toUpperCase()}
                    </div>
                    <span className={e.uid === user?.uid ? 'text-cyan-300' : 'text-gray-200'}>
                      {e.displayName}
                    </span>
                    {e.uid === user?.uid && <span className="text-xs text-cyan-600">(you)</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-gray-400">{e.solved_count}</td>
                <td className="px-4 py-3 text-right text-red-400 hidden sm:table-cell">
                  {e.first_bloods > 0 ? `🩸 ${e.first_bloods}` : '-'}
                </td>
                <td className="px-4 py-3 text-right font-bold text-cyan-400">{e.total_points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

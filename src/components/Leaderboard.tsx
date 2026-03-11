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
    return onSnapshot(q, snap => {
      setEntries(snap.docs.map(d => ({
        uid: d.id,
        displayName:    d.data().displayName    || 'Anonymous',
        photoURL:       d.data().photoURL,
        total_points:   d.data().total_points   || 0,
        solved_count:   (d.data().solved_challenges || []).length,
        first_bloods:   d.data().first_bloods   || 0,
        last_solve_time: d.data().last_solve_time || null,
      })))
    }, () => {})
  }, [])

  const podium = entries.slice(0, 3)
  const rest   = entries.slice(3)

  const podiumStyle = [
    { medal: '🥇', ring: 'ring-yellow-400/40',  bg: 'bg-yellow-950/20 border-yellow-700/40', text: 'text-yellow-300', order: 'order-2', scale: 'scale-105' },
    { medal: '🥈', ring: 'ring-gray-400/40',    bg: 'bg-gray-800/60 border-gray-600/40',     text: 'text-gray-300',  order: 'order-1', scale: 'scale-100' },
    { medal: '🥉', ring: 'ring-orange-700/40',  bg: 'bg-orange-950/20 border-orange-800/40', text: 'text-orange-400', order: 'order-3', scale: 'scale-100' },
  ]

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-cyan-400 tracking-wide">{t('title')}</h1>

      {/* Podium top 3 */}
      {podium.length > 0 && (
        <div className="flex justify-center items-end gap-3">
          {podium.map((e, i) => {
            const s = podiumStyle[i]
            const isMe = e.uid === user?.uid
            return (
              <div
                key={e.uid}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border ${s.bg} ${s.order} ${s.scale} transition-transform w-36`}
              >
                <div className={`w-12 h-12 rounded-full ring-2 ${s.ring} flex items-center justify-center text-lg font-bold bg-gray-800 ${isMe ? 'ring-cyan-400/60' : ''}`}>
                  {e.displayName[0]?.toUpperCase()}
                </div>
                <div className="text-lg">{s.medal}</div>
                <div className={`text-xs font-semibold text-center truncate w-full ${isMe ? 'text-cyan-300' : s.text}`}>
                  {e.displayName}
                </div>
                <div className="text-cyan-400 font-bold tabular-nums">{e.total_points}</div>
                <div className="text-gray-500 text-xs">{e.solved_count} solved</div>
              </div>
            )
          })}
        </div>
      )}

      {/* Table 4th+ */}
      {rest.length > 0 && (
        <div className="bg-gray-900/80 border border-gray-700/60 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-3 w-12">{t('rank')}</th>
                <th className="text-left px-4 py-3">{t('player')}</th>
                <th className="text-right px-4 py-3">{t('solved')}</th>
                <th className="text-right px-4 py-3 hidden sm:table-cell">{t('first_bloods')}</th>
                <th className="text-right px-4 py-3">{t('points')}</th>
              </tr>
            </thead>
            <tbody>
              {rest.map((e, i) => {
                const isMe = e.uid === user?.uid
                return (
                  <tr
                    key={e.uid}
                    className={`border-b border-gray-800/50 last:border-0 transition-colors ${
                      isMe ? 'bg-cyan-950/20 text-cyan-300' : 'hover:bg-gray-800/40'
                    }`}
                  >
                    <td className="px-4 py-3 font-mono text-gray-500 text-xs">#{i + 4}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold shrink-0">
                          {e.displayName[0]?.toUpperCase()}
                        </div>
                        <span className={`truncate max-w-[140px] ${isMe ? 'text-cyan-300' : 'text-gray-300'}`}>
                          {e.displayName}
                        </span>
                        {isMe && <span className="text-xs text-cyan-600 shrink-0">(you)</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400 tabular-nums">{e.solved_count}</td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell text-red-400 tabular-nums">
                      {e.first_bloods > 0 ? `🩸 ${e.first_bloods}` : <span className="text-gray-700">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-cyan-400 tabular-nums">{e.total_points}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {entries.length === 0 && (
        <div className="text-center py-20 text-gray-600 font-mono">
          <div className="text-4xl mb-3">🏆</div>
          {t('empty')}
        </div>
      )}
    </div>
  )
}

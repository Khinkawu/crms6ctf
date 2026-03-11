'use client'
import { useTranslations } from 'next-intl'
import { useParams, useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useState } from 'react'

export default function Navbar() {
  const t = useTranslations('nav')
  const { locale } = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const { user, profile, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const toggleLocale = () => {
    const newLocale = locale === 'th' ? 'en' : 'th'
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`)
    router.replace(newPath)
  }

  const navItems = [
    { label: t('challenges'), href: `/${locale}/challenges` },
    { label: t('leaderboard'), href: `/${locale}/leaderboard` },
    ...(user ? [{ label: t('dashboard'), href: `/${locale}/dashboard` }] : []),
    ...(profile?.role === 'coach' ? [{ label: t('coach'), href: `/${locale}/coach` }] : []),
  ]

  return (
    <nav className="border-b border-gray-800 bg-gray-950/90 backdrop-blur sticky top-0 z-50">
      <div className="container mx-auto px-4 max-w-6xl flex items-center justify-between h-14">
        <button onClick={() => router.push(`/${locale}`)} className="text-cyan-400 font-bold text-lg tracking-widest">
          CRMS6<span className="text-gray-500">_</span>CTF
        </button>

        <div className="hidden md:flex items-center gap-6">
          {navItems.map(item => (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`text-sm transition-colors ${
                pathname.startsWith(item.href) ? 'text-cyan-400' : 'text-gray-400 hover:text-gray-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleLocale}
            className="text-xs border border-gray-700 hover:border-cyan-400 text-gray-400 hover:text-cyan-400 px-2 py-1 rounded transition-colors"
          >
            {locale === 'th' ? 'EN' : 'TH'}
          </button>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 text-sm text-gray-300 hover:text-white"
              >
                <div className="w-7 h-7 rounded-full bg-cyan-800 flex items-center justify-center text-xs text-cyan-200 font-bold">
                  {profile?.displayName?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="hidden md:block max-w-[100px] truncate">{profile?.displayName}</span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-gray-900 border border-gray-700 rounded-lg shadow-xl py-1 z-50">
                  <button
                    onClick={() => { router.push(`/${locale}/dashboard`); setMenuOpen(false) }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
                  >
                    {t('dashboard')}
                  </button>
                  <hr className="border-gray-700 my-1" />
                  <button
                    onClick={() => { logout(); setMenuOpen(false) }}
                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-800"
                  >
                    {t('logout')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => router.push(`/${locale}/auth`)}
              className="text-sm bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold px-3 py-1.5 rounded transition-colors"
            >
              {t('login')}
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}

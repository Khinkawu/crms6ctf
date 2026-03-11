'use client'
import { useTranslations } from 'next-intl'
import { useParams, useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

export default function Navbar() {
  const t = useTranslations('nav')
  const { locale } = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const { user, profile, logout } = useAuth()
  const [menuOpen, setMenuOpen]     = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false) }, [pathname])

  const toggleLocale = () => {
    const newLocale = locale === 'th' ? 'en' : 'th'
    router.replace(pathname.replace(`/${locale}`, `/${newLocale}`))
  }

  const navItems = [
    { label: t('challenges'), href: `/${locale}/challenges` },
    { label: t('leaderboard'), href: `/${locale}/leaderboard` },
    ...(user ? [{ label: t('dashboard'), href: `/${locale}/dashboard` }] : []),
    ...(profile?.role === 'coach' ? [{ label: t('coach'), href: `/${locale}/coach` }] : []),
  ]

  const isActive = (href: string) => pathname.startsWith(href)

  return (
    <nav className="border-b border-gray-800/80 bg-black/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 max-w-6xl flex items-center justify-between h-14">

        {/* Logo */}
        <button
          onClick={() => router.push(`/${locale}`)}
          className="flex items-center gap-2 group"
        >
          <Image src="/logo.png" alt="CRMS6 CTF" width={30} height={30} className="rounded opacity-90 group-hover:opacity-100 transition-opacity" />
          <span className="text-cyan-400 font-bold text-base tracking-widest">
            CRMS6<span className="text-gray-600">_</span>CTF
          </span>
        </button>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map(item => (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                isActive(item.href)
                  ? 'text-cyan-400 bg-cyan-950/30'
                  : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800/50'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {/* Locale toggle */}
          <button
            onClick={toggleLocale}
            className="text-xs border border-gray-700 hover:border-cyan-500/60 text-gray-500 hover:text-cyan-400 px-2 py-1 rounded-md transition-colors font-mono"
          >
            {locale === 'th' ? 'EN' : 'TH'}
          </button>

          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 text-sm text-gray-300 hover:text-white rounded-lg px-2 py-1 hover:bg-gray-800/50 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-cyan-900 border border-cyan-700/50 flex items-center justify-center text-xs text-cyan-200 font-bold">
                  {profile?.displayName?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="hidden md:block max-w-[100px] truncate text-xs text-gray-400">
                  {profile?.displayName}
                </span>
                <span className="text-gray-600 text-xs">{menuOpen ? '▲' : '▼'}</span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-gray-900 border border-gray-700/60 rounded-xl shadow-2xl py-1 z-50 backdrop-blur-sm">
                  <div className="px-4 py-2 border-b border-gray-800">
                    <p className="text-xs text-gray-500 truncate">{profile?.displayName}</p>
                    <p className="text-xs text-cyan-600 font-mono">{profile?.total_points || 0} pts</p>
                  </div>
                  <button
                    onClick={() => { router.push(`/${locale}/dashboard`); setMenuOpen(false) }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                  >
                    {t('dashboard')}
                  </button>
                  <hr className="border-gray-800 my-1" />
                  <button
                    onClick={() => { logout(); setMenuOpen(false) }}
                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-800 transition-colors"
                  >
                    {t('logout')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => router.push(`/${locale}/auth`)}
              className="text-sm bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold px-3 py-1.5 rounded-lg transition-all hover:shadow-[0_0_12px_rgba(34,211,238,0.3)]"
            >
              {t('login')}
            </button>
          )}

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-1.5 text-gray-400 hover:text-gray-200 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            <div className="space-y-1.5">
              <span className={`block w-5 h-0.5 bg-current transition-all ${mobileOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block w-5 h-0.5 bg-current transition-all ${mobileOpen ? 'opacity-0' : ''}`} />
              <span className={`block w-5 h-0.5 bg-current transition-all ${mobileOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-800/60 bg-black/90 backdrop-blur-sm">
          <div className="px-4 py-3 space-y-1">
            {navItems.map(item => (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive(item.href)
                    ? 'text-cyan-400 bg-cyan-950/30'
                    : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800/50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}

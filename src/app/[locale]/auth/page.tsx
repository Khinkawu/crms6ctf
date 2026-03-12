'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

type Tab = 'login' | 'register' | 'forgot'

export default function AuthPage() {
  const t = useTranslations('auth')
  const { locale } = useParams()
  const router = useRouter()
  const { signInEmail, signUpEmail, signInGoogle, resetPassword } = useAuth()
  const [tab, setTab] = useState<Tab>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setSuccess(''); setSubmitting(true)
    try {
      if (tab === 'login') {
        await signInEmail(email, password)
        router.push(`/${locale}/challenges`)
      } else if (tab === 'register') {
        await signUpEmail(email, password, displayName)
        setSuccess(t('verify_email'))
      } else {
        await resetPassword(email)
        setSuccess(t('reset_sent'))
      }
    } catch (err: any) {
      setError(err.message || 'Error')
    } finally {
      setSubmitting(false)
    }
  }

  const TabBtn = ({ id, label }: { id: Tab, label: string }) => (
    <button
      onClick={() => { setTab(id); setError(''); setSuccess('') }}
      className={`px-4 py-2 text-sm font-medium transition-colors ${
        tab === id ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-500 hover:text-gray-300'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="max-w-sm mx-auto mt-16">
      <div className="text-center mb-6 text-cyan-400 text-2xl font-bold tracking-widest">CRMS6_CTF</div>
      <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
        <div className="flex border-b border-gray-700">
          <TabBtn id="login" label={t('login_title')} />
          <TabBtn id="register" label={t('register_title')} />
          <TabBtn id="forgot" label={t('reset_password')} />
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {tab === 'register' && (
            <div className="space-y-1">
              <label className="text-xs text-gray-400">{t('display_name')}</label>
              <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} required
                className="w-full bg-gray-800 border border-gray-600 focus:border-cyan-500 rounded-lg px-3 py-2 text-sm text-gray-100 outline-none transition-colors" />
            </div>
          )}
          <div className="space-y-1">
            <label className="text-xs text-gray-400">{t('email')}</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full bg-gray-800 border border-gray-600 focus:border-cyan-500 rounded-lg px-3 py-2 text-sm text-gray-100 outline-none transition-colors" />
          </div>
          {tab !== 'forgot' && (
            <div className="space-y-1">
              <label className="text-xs text-gray-400">{t('password')}</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                className="w-full bg-gray-800 border border-gray-600 focus:border-cyan-500 rounded-lg px-3 py-2 text-sm text-gray-100 outline-none transition-colors" />
            </div>
          )}
          {error && <p className="text-red-400 text-xs">{error}</p>}
          {success && <p className="text-green-400 text-xs">{success}</p>}
          <button type="submit" disabled={submitting}
            className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:bg-gray-700 disabled:text-gray-500 text-gray-950 font-bold py-2 rounded-lg transition-colors text-sm">
            {submitting ? '...' : tab === 'login' ? t('login_btn') : tab === 'register' ? t('register_btn') : t('reset_password')}
          </button>
          {tab !== 'forgot' && (
            <>
              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 border-t border-gray-700" />
                <span className="text-xs text-gray-600">or</span>
                <div className="flex-1 border-t border-gray-700" />
              </div>
              <button type="button"
                onClick={async () => {
                  try { await signInGoogle(); router.push(`/${locale}/challenges`) }
                  catch (e: any) { setError(e.message) }
                }}
                className="w-full border border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white py-2 rounded-lg transition-colors text-sm flex items-center justify-center gap-2">
                <span className="font-bold text-blue-400">G</span> {t('google_btn')}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  )
}

'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function SettingsPage() {
  const t = useTranslations('auth')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const { changePassword } = useAuth()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (next !== confirm) { setError('Passwords do not match'); return }
    setLoading(true); setError(''); setSuccess('')
    try {
      await changePassword(current, next)
      setSuccess('Password changed successfully')
      setCurrent(''); setNext(''); setConfirm('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-8 space-y-4">
      <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-300 text-sm">
        ← {tCommon('back')}
      </button>
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 space-y-4">
        <h1 className="text-lg font-bold text-gray-100">{t('change_password')}</h1>
        <form onSubmit={handleSubmit} className="space-y-3">
          {[
            { label: t('current_password'), value: current, set: setCurrent },
            { label: t('new_password'), value: next, set: setNext },
            { label: t('confirm_password'), value: confirm, set: setConfirm },
          ].map(({ label, value, set }) => (
            <div key={label} className="space-y-1">
              <label className="text-xs text-gray-400">{label}</label>
              <input type="password" value={value} onChange={e => set(e.target.value)} required
                className="w-full bg-gray-800 border border-gray-600 focus:border-cyan-500 rounded-lg px-3 py-2 text-sm text-gray-100 outline-none" />
            </div>
          ))}
          {error && <p className="text-red-400 text-xs">{error}</p>}
          {success && <p className="text-green-400 text-xs">{success}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:bg-gray-700 text-gray-950 font-bold py-2 rounded-lg text-sm">
            {loading ? '...' : tCommon('save')}
          </button>
        </form>
      </div>
    </div>
  )
}

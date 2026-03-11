'use client'
import { useEffect } from 'react'

export default function ConsoleChallengePage() {
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).secretFlag = 'flag{533b13276cd2da67b9db0389368d77c0}'
    console.log('%c[CRMS6 CTF] A secret variable has been set. Can you find it?', 'color: cyan')
  }, [])

  return (
    <div className="max-w-xl mx-auto py-16 text-center space-y-4">
      <h1 className="text-2xl font-bold text-cyan-400">Console Secret</h1>
      <p className="text-gray-400">Something was left in the browser console.</p>
      <p className="text-gray-600 text-sm">Press F12 → Console tab</p>
    </div>
  )
}

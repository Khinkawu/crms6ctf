export default function CookieChallenge() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
      <div className="text-4xl">🍪</div>
      <h1 className="text-2xl font-bold text-cyan-400">Cookie Monster</h1>
      <p className="text-gray-400 max-w-md text-sm leading-relaxed">
        Mmm, cookies! Something tasty was left in your browser.<br />
        Open DevTools → Application → Cookies and decode what you find.
      </p>
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 text-xs text-gray-500 font-mono">
        Hint: ดูที่ <span className="text-cyan-400">DevTools → Application → Cookies</span>
      </div>
    </div>
  )
}

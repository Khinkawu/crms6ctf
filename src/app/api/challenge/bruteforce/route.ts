import { NextRequest, NextResponse } from 'next/server'

// Brute Force challenge — weak credentials login simulation
// Correct: admin / password123
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { username, password } = body as { username?: string; password?: string }

  if (!username || !password) {
    return NextResponse.json({ success: false, error: 'Missing credentials' }, { status: 400 })
  }

  // Simulate rate-limiting hint header
  const attempts = req.headers.get('x-attempt') || '1'
  const res = new NextResponse(null)

  if (username === 'admin' && password === 'password123') {
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      flag: 'flag{9a3f2c8e1b7d4a6e5c9b3f2a8e1d7c4b}',
    })
  }

  return NextResponse.json(
    { success: false, error: 'Invalid username or password' },
    { status: 401, headers: { 'X-Attempt': attempts } }
  )
}

import { NextResponse } from 'next/server'

export async function GET() {
  const res = NextResponse.json({ message: 'Nothing to see here...' })
  res.headers.set('X-Flag', 'flag{9cf4886a09240112cc61b0616305f0a5}')
  return res
}

import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const isAdmin = req.headers.get('x-admin')
  if (isAdmin === 'true') {
    return NextResponse.json({ flag: 'flag{d72b45d80807430f2c3595d8f23e8bae}' })
  }
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

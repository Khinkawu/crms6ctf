import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret === 'crms6') {
    return NextResponse.json({ flag: 'flag{805463a7d0b903cbb77a2bd66a116bd0}' })
  }
  return NextResponse.json({ message: 'Access denied.' }, { status: 403 })
}

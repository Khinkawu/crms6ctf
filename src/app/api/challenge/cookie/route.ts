import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const locale = req.nextUrl.searchParams.get('locale') || 'th'
   const encoded = 'YjEzZWQzNDQxZTEwYWY0NTBkNjMzNjBhNWU2ZjFiODI='
   const res = NextResponse.redirect(new URL(`/${locale}/challenge-cookie`, req.url))
   res.cookies.set('session_token', encoded, { httpOnly: false, path: '/' })
  return res
}

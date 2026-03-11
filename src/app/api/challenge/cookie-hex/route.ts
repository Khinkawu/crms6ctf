import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const locale = req.nextUrl.searchParams.get('locale') || 'th'
  const hexValue = '666c61677b35363235376463353339343566663938373835646566363133386331633066357d'
  const res = NextResponse.redirect(new URL(`/${locale}/challenges`, req.url))
  res.cookies.set('auth_token', hexValue, { httpOnly: false, path: '/' })
  return res
}

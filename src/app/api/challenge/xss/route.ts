import { NextRequest, NextResponse } from 'next/server'

// XSS challenge — reflects user input in HTML response (intentionally unsafe for CTF)
// Flag is stored in a "cookie" shown only when XSS payload is detected
// Students learn: unsanitized input → script execution → cookie theft
const FLAG = '3c8a1e6b9f2d4e7a5b8c3f1e6d9a2b4c'
const SESSION_COOKIE = `session=eyJ1c2VyIjoiYWRtaW4iLCJmbGFnIjoiJHtGTEFHfSJ9` // mock JWT

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get('name') ?? 'Guest'

  // Detect XSS payload
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /onerror=/i,
    /onload=/i,
    /onclick=/i,
    /on\w+\s*=/i,
    /<img/i,
    /<svg/i,
    /alert\s*\(/i,
  ]
  const hasXSS = xssPatterns.some(p => p.test(name))

  const flagComment = hasXSS
    ? `\n    <!-- [SYSTEM] XSS detected. Your payload executed as: ${name} -->
    <!-- Stolen cookie: document.cookie = "${SESSION_COOKIE}" -->
    <!-- Flag extracted: ${FLAG} -->`
    : ''

  const html = `<!DOCTYPE html>
<html>
<head><title>Welcome Page</title></head>
<body>
  <h2>Welcome, ${name}!</h2>
  <p>This page greets registered users by name.</p>${flagComment}
</body>
</html>`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
      'X-XSS-Protection': '0',  // intentionally disabled for CTF
    },
  })
}

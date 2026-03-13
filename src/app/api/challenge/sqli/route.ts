import { NextRequest, NextResponse } from 'next/server'

// SQL Injection challenge — simulates vulnerable query
// Mock DB: users table with id, username, password
// Intended bypass: ' OR '1'='1  OR  admin'--  OR  1=1
const MOCK_USERS = [
  { id: 1, username: 'alice', password: 'hunter2', role: 'user' },
  { id: 2, username: 'bob',   password: 'letmein', role: 'user' },
   { id: 0, username: 'admin', password: '🔒', role: 'admin', flag: '7b4e2d9f1c6a8b3e5d7f2a4c9e1b6d8f' },
]

function simulateSqliQuery(input: string): typeof MOCK_USERS {
  // Detect SQL injection patterns (OR bypass, comment, always-true)
  const injectPatterns = [
    /'\s*or\s*['"\d]/i,
    /--/,
    /1\s*=\s*1/i,
    /#/,
    /\/\*/,
    /;\s*drop/i,
    /union\s+select/i,
    /'\s*;\s*/,
  ]
  const isInjected = injectPatterns.some(p => p.test(input))
  if (isInjected) return MOCK_USERS   // "all rows returned" due to bypass
  // Normal query: match by username
  return MOCK_USERS.filter(u => u.username === input)
}

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get('username') ?? ''

  // Return raw query string for educational purposes
  const mockQuery = `SELECT * FROM users WHERE username = '${username}'`
  const results = simulateSqliQuery(username)

  return NextResponse.json({
    query: mockQuery,
    rows: results.length,
    data: results.map(u => ({
      id: u.id,
      username: u.username,
      role: u.role,
      ...(u.role === 'admin' ? { secret: (u as any).flag } : {}),
    })),
  })
}

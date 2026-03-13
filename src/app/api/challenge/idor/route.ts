import { NextRequest, NextResponse } from 'next/server'

// IDOR challenge — Insecure Direct Object Reference
// Accessing another user's data by changing the user_id parameter
// Normal user: id=42 (their own profile)
// Admin: id=1 (has flag)

const USERS: Record<string, { name: string; email: string; role: string; data?: string }> = {
  '42': { name: 'You (student)', email: 'student@crms6.ac.th', role: 'student' },
  '7':  { name: 'Teacher Somchai', email: 'somchai@crms6.ac.th', role: 'teacher' },
  '13': { name: 'IT Coordinator', email: 'it@crms6.ac.th', role: 'staff' },
  '1':  {
    name:  'Administrator',
    email: 'admin@crms6.ac.th',
    role:  'admin',
    data:  '8d3e7f2a5b9c4d1e6a8f3b7c2d9e4a5f',
  },
}

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('user_id') ?? '42'

  const user = USERS[userId]
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  return NextResponse.json({
    user_id: userId,
    name:    user.name,
    email:   user.email,
    role:    user.role,
    ...(user.data ? { private_data: user.data } : {}),
  })
}

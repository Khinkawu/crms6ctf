import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

// JWT Algorithm "none" or weak secret challenge

const SECRET = 'weaksecret'
const FLAG = 'flag{jwt_alg_n0n3_1s_n0_g00d}'

export async function GET(req: NextRequest) {
  // Return a guest token to the user
  const token = jwt.sign({ role: 'guest', user: 'anon' }, SECRET, { expiresIn: '1h' })
  
  return NextResponse.json({
    message: "Welcome guest. You need admin role to view the flag.",
    token: token
  })
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing Bearer token' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]

    // Challenge logic: Accept 'none' algorithm or weak secret payload
    let decoded: any
    
    // We manually decode to check alg since jsonwebtoken throws on none by default securely
    const parts = token.split('.')
    if (parts.length < 2) throw new Error("Invalid JWT")
    
    const header = JSON.parse(Buffer.from(parts[0], 'base64').toString())
    
    if (header.alg?.toLowerCase() === 'none') {
      // Simulate "none" algorithm acceptance vulnerability
      decoded = JSON.parse(Buffer.from(parts[1], 'base64').toString())
    } else {
      // Otherwise verify with secret
      decoded = jwt.verify(token, SECRET)
    }

    if (decoded && decoded.role === 'admin') {
      return NextResponse.json({ success: true, flag: FLAG })
    } else {
      return NextResponse.json({ success: false, message: 'You are not admin.' }, { status: 403 })
    }

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}

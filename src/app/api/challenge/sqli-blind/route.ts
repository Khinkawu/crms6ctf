import { NextRequest, NextResponse } from 'next/server'

// Simulated Blind SQL Injection (Time-based & Boolean-based)
// The user sends ?username=XXX and we simulate a database check.

const SECRET_PASS_FLAG = 'flag{bl1nd_sq1_t1m3_b4s3d}'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const username = url.searchParams.get('username')

    if (!username) {
      return NextResponse.json({ error: 'Missing username parameter.' }, { status: 400 })
    }

    // Simulate basic time-based SQLi check by parsing simplistic payloads 
    // e.g. ' OR IF(SUBSTR(password,1,1)='f', SLEEP(3), 0) --
    
    // Very dummy string regex checking to simulate the oracle:
    const regex = /IF\(SUBSTR\(password,(\d+),1\)='(.)', SLEEP\((\d+)\), 0\)/i
    const match = username.match(regex)
    
    if (match) {
      const pos = parseInt(match[1], 10) - 1
      const char = match[2]
      const sleepTime = parseInt(match[3], 10)
      
      let isCorrect = false
      if (pos >= 0 && pos < SECRET_PASS_FLAG.length) {
        if (SECRET_PASS_FLAG[pos] === char) {
          isCorrect = true
        }
      }

      if (isCorrect) {
        // Enforce max 5s sleep to not hang dev entirely
        const wait = Math.min(sleepTime * 1000, 5000)
        await new Promise(r => setTimeout(r, wait))
        return NextResponse.json({ exists: true })
      } else {
        return NextResponse.json({ exists: false })
      }
    }

    // Direct match
    if (username === 'admin') {
       return NextResponse.json({ exists: true })
    }

    return NextResponse.json({ exists: false })
    
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

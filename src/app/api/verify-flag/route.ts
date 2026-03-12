import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { initializeApp, getApps, getApp } from 'firebase/app'
import { getFirestore, doc, getDoc } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

function getDb() {
  try {
    return getFirestore(getApp())
  } catch {
    const app = initializeApp(firebaseConfig)
    return getFirestore(app)
  }
}

function sha256(text: string): string {
  return createHash('sha256').update(text).digest('hex')
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { challengeId, flag } = body as { challengeId?: string; flag?: string }

    if (!challengeId || !flag) {
      return NextResponse.json({ error: 'Missing challengeId or flag' }, { status: 400 })
    }

    const db = getDb()
    const challengeSnap = await getDoc(doc(db, 'challenges', challengeId))

    if (!challengeSnap.exists()) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }

    const challengeData = challengeSnap.data()
    const storedHash = challengeData.flag_hash as string

    // Normalize and hash the submitted flag (same as seed page sha256)
    const normalizedFlag = flag.trim().toLowerCase()
    const submittedHash = sha256(normalizedFlag)

    const correct = submittedHash === storedHash

    return NextResponse.json({ correct })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Internal error'
    console.error('[verify-flag] Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

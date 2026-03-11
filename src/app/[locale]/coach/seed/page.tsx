'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { collection, addDoc, getCountFromServer, getDocs, query, where, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'

async function sha256(text: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

const CHALLENGES = [
  // ── GEN ──
  {
    title_th: 'สวัสดี CTF', title_en: 'Hello CTF',
    description_th: 'ยินดีต้อนรับสู่ CRMS6 CTF!\n\nมีข้อมูลที่ถูกซ่อนไว้ในรูปแบบ Base64 ด้านล่าง\nถอดรหัสมันเพื่อรับ flag\n\n```\nZmxhZ3tmODRlMGIxMGJmNzE5ZjBmNDdhYTlkYmFlY2IxZTlmNH0=\n```',
    description_en: 'Welcome to CRMS6 CTF!\n\nDecode this to get the flag.\n\n```\nZmxhZ3tmODRlMGIxMGJmNzE5ZjBmNDdhYTlkYmFlY2IxZTlmNH0=\n```',
    category: 'GEN', difficulty: 'Easy', base_points: 100,
    flag: 'flag{f84e0b10bf719f0f47aa9dbaecb1e9f4}',
    hints: [
      { text_th: 'Base64 ใช้ตัวอักษร A-Z, a-z, 0-9, +, /', text_en: 'Base64 uses A-Z, a-z, 0-9, +, /', penalty_pct: 0 },
      { text_th: 'python3: base64.b64decode("...").decode()', text_en: 'python3: base64.b64decode("...").decode()', penalty_pct: 25 },
    ],
    solution_th: 'Base64 decode → flag{f84e0b10bf719f0f47aa9dbaecb1e9f4}',
    visible: true,
  },
  {
    title_th: 'อาหารเช้า Binary', title_en: 'Binary Breakfast',
    description_th: 'เลข 0 และ 1 คือภาษาของคอมพิวเตอร์\nแปลงข้อความด้านล่างให้เป็น flag\n\n```\n01100110 01101100 01100001 01100111 01111011 01100110 00110000 00111000 00110001 00110101 01100011 00110001 00110001 00110011 01100101 00110111 00110110 00110110 00111000 00111001 00110110 00111001 00110100 00110000 01100101 00111001 00110101 00110111 00111001 00110000 00111000 00111001 00111001 00110110 00111000 01100010 00110001 01111101\n```',
    description_en: 'The language of computers is 0 and 1.\nConvert the binary below to get the flag.\n\n```\n01100110 01101100 01100001 01100111 01111011 01100110 00110000 00111000 00110001 00110101 01100011 00110001 00110001 00110011 01100101 00110111 00110110 00110110 00111000 00111001 00110110 00111001 00110100 00110000 01100101 00111001 00110101 00110111 00111001 00110000 00111000 00111001 00111001 00110110 00111000 01100010 00110001 01111101\n```',
    category: 'GEN', difficulty: 'Easy', base_points: 100,
    flag: 'flag{f0815c113e766896940e9579089968b1}',
    hints: [
      { text_th: 'แต่ละกลุ่ม 8 bits = 1 ตัวอักษร ASCII', text_en: 'Each group of 8 bits = 1 ASCII character', penalty_pct: 0 },
      { text_th: 'python: chr(int("01100110", 2)) = "f"', text_en: 'python: chr(int("01100110", 2)) = "f"', penalty_pct: 25 },
    ],
    solution_th: "''.join(chr(int(b,2)) for b in bits.split())",
    visible: true,
  },
  // ── CRYPTO ──
  {
    title_th: '亡靈凱撒', title_en: "Caesar's Ghost",
    description_th: 'จักรพรรดิ Caesar ใช้รหัสลับที่ง่ายมาก\nช่วยถอดรหัสข้อความนี้:\n\n```\nsynt{26r720122sr34oro1o49rq96264rn86s}\n```',
    description_en: "Julius Caesar used a simple cipher.\nDecode this:\n\n```\nsynt{26r720122sr34oro1o49rq96264rn86s}\n```",
    category: 'CRYPTO', difficulty: 'Easy', base_points: 100,
    flag: 'flag{26e720122fe34beb1b49ed96264ea86f}',
    hints: [
      { text_th: 'ROT13 คือ Caesar shift = 13', text_en: 'ROT13 is Caesar with shift = 13', penalty_pct: 0 },
      { text_th: 'python: codecs.decode("synt{...}", "rot_13")', text_en: 'python: codecs.decode("synt{...}", "rot_13")', penalty_pct: 25 },
      { text_th: 'CyberChef → ROT13', text_en: 'CyberChef → ROT13', penalty_pct: 50 },
    ],
    solution_th: 'codecs.decode("synt{26r720122sr34oro1o49rq96264rn86s}", "rot_13")',
    visible: true,
  },
  {
    title_th: 'ฐานไม่พบ', title_en: 'Base Not Found',
    description_th: 'ข้อความนี้ถูกเข้ารหัสหลายชั้น ลองถอดดู:\n\n```\nTVpXR0NaMzNHUTNET05SUUdWUldNWVRETU00RElOTEVHRlNUS01EQ0dGUldHWkJSR1EyREVaREdHWTJIMj09PQ==\n```',
    description_en: 'This text is encoded in multiple layers. Peel them all.\n\n```\nTVpXR0NaMzNHUTNET05SUUdWUldNWVRETU00RElOTEVHRlNUS01EQ0dGUldHWkJSR1EyREVaREdHWTJIMj09PQ==\n```',
    category: 'CRYPTO', difficulty: 'Easy', base_points: 100,
    flag: 'flag{467605cfbcc845d1e50b1ccd1442df64}',
    hints: [
      { text_th: 'ลงท้าย == → Base64', text_en: 'Ending with == → Base64', penalty_pct: 0 },
      { text_th: 'Decode Base64 ก่อน แล้วดูผลลัพธ์', text_en: 'Decode Base64 first, then identify the result', penalty_pct: 25 },
      { text_th: 'Base64 → Base32 → text', text_en: 'Base64 → Base32 → text', penalty_pct: 50 },
    ],
    solution_th: 'base64.b32decode(base64.b64decode("TVpXR...")).decode()',
    visible: true,
  },
  {
    title_th: 'อีโมจิพูดได้', title_en: 'Emoji Cipher',
    description_th: 'อีโมจิเหล่านี้ซ่อน flag ไว้ หา pattern แล้วถอดรหัส:\n\n```\n🙆🙌🙁🙇🙛😓🙄🙆😖😒😗🙅🙆😙😔😙🙃😖😐😔😗🙅😙😓😗🙅😓🙄🙃😔🙁😑😑🙂😓🙆😑🙝\n```',
    description_en: 'These emojis hide a flag. Find the pattern and decode:\n\n```\n🙆🙌🙁🙇🙛😓🙄🙆😖😒😗🙅🙆😙😔😙🙃😖😐😔😗🙅😙😓😗🙅😓🙄🙃😔🙁😑😑🙂😓🙆😑🙝\n```',
    category: 'CRYPTO', difficulty: 'Medium', base_points: 300,
    flag: 'flag{3df627ef949c6047e937e3dc4a11b3f1}',
    hints: [
      { text_th: 'สังเกต Unicode code point ของ emoji', text_en: 'Look at the Unicode code points of each emoji', penalty_pct: 0 },
      { text_th: '😀 = U+1F600. offset + 32 = ASCII', text_en: '😀 = U+1F600. offset + 32 = ASCII char', penalty_pct: 25 },
      { text_th: 'chr(ord(e) - 0x1F600 + 32)', text_en: 'chr(ord(e) - 0x1F600 + 32)', penalty_pct: 50 },
    ],
    solution_th: "''.join(chr(ord(e)-0x1F600+32) for e in emojis)",
    visible: true,
  },
  {
    title_th: 'นักรบ XOR', title_en: 'XOR Warrior',
    description_th: 'XOR คืออาวุธลับของ cryptographer\nถอดรหัส hex string นี้ด้วย single-byte key:\n\n```\n242e23253973237a7127202124717a26757a7b7a207a7a21277777722072727624777072763f\n```',
    description_en: 'XOR is the secret weapon of cryptographers.\nDecrypt this hex with a single-byte key:\n\n```\n242e23253973237a7127202124717a26757a7b7a207a7a21277777722072727624777072763f\n```',
    category: 'CRYPTO', difficulty: 'Hard', base_points: 500,
    flag: 'flag{1a83ebcf38d7898b88ce550b004f5204}',
    hints: [
      { text_th: 'XOR brute force: ลอง 0x00-0xFF ทุกค่า', text_en: 'Brute force: try every key from 0x00 to 0xFF', penalty_pct: 0 },
      { text_th: 'flag ขึ้นต้นด้วย "flag{" ใช้ check key', text_en: 'Valid flag starts with "flag{" — use this to find the key', penalty_pct: 25 },
      { text_th: 'bytes(b ^ 0x42 for b in bytes.fromhex(...))', text_en: 'bytes(b ^ 0x42 for b in bytes.fromhex(...))', penalty_pct: 50 },
    ],
    solution_th: 'key = 0x42\nbytes(b ^ 0x42 for b in bytes.fromhex("242e23253973237a7127202124717a26757a7b7a207a7a21277777722072727624777072763f")).decode()',
    visible: true,
  },
  // ── MISC ──
  {
    title_th: 'มอร์สในความมืด', title_en: 'Morse in the Dark',
    description_th: '... --- ...\nถอดรหัสโค้ดมอร์สด้านล่าง แล้วใส่ใน flag{...}\n\n```\n. .---- . -... -.-. ---.. ..--- ..... -.... -.... ----- --... --... -... ..... ....- ...-- -.. ----- -.. ..... -.. . .- ....- ..... ---.. ....- ----. -.. -.... -...\n```',
    description_en: '... --- ...\nDecode the Morse below and wrap in flag{...}\n\n```\n. .---- . -... -.-. ---.. ..--- ..... -.... -.... ----- --... --... -... ..... ....- ...-- -.. ----- -.. ..... -.. . .- ....- ..... ---.. ....- ----. -.. -.... -...\n```',
    category: 'MISC', difficulty: 'Easy', base_points: 100,
    flag: 'flag{e1ebc82566077b543d0d5dea45849d6b}',
    hints: [
      { text_th: '. = dit, - = dah, space = คั่นตัวอักษร', text_en: '. = dit, - = dah, space = letter separator', penalty_pct: 0 },
      { text_th: 'ใช้ dcode.fr/en/morse-code', text_en: 'Use dcode.fr/en/morse-code', penalty_pct: 25 },
    ],
    solution_th: 'Morse decode → e1ebc82566077b543d0d5dea45849d6b → flag{...}',
    visible: true,
  },
  {
    title_th: 'ปฏิกิริยาลูกโซ่', title_en: 'Chain Reaction',
    description_th: 'บางอย่างถูกเข้ารหัสหลายขั้นตอน — ลอกชั้นออกทีละชั้น:\n\n```\nfTEzYWIyODExMTJmMDAxYWFhZDBjMWNmM2RlNjhlNWI2e2dhbGY=\n```',
    description_en: 'Something is encoded in multiple steps — peel each layer:\n\n```\nfTEzYWIyODExMTJmMDAxYWFhZDBjMWNmM2RlNjhlNWI2e2dhbGY=\n```',
    category: 'MISC', difficulty: 'Medium', base_points: 300,
    flag: 'flag{6b5e86ed3fc1c0daaa100f211182ba31}',
    hints: [
      { text_th: 'ลงท้าย = → Base64', text_en: 'Ending with = → Base64', penalty_pct: 0 },
      { text_th: 'หลัง decode step แรก ลองอ่านกลับหน้าหลัง', text_en: 'After first decode, try reading the result backwards', penalty_pct: 25 },
      { text_th: 'Base64 → reverse → flag', text_en: 'Base64 → reverse → flag', penalty_pct: 50 },
    ],
    solution_th: "base64.b64decode('fTEzYWI...').decode()[::-1]",
    visible: true,
  },
  // ── FOR ──
  {
    title_th: 'ซ่อนในภาพ', title_en: 'Hidden in Plain Sight',
    description_th: 'ภาพนี้ดูธรรมดา แต่มีบางอย่างซ่อนอยู่ที่มองไม่เห็นด้วยตาเปล่า\nดาวน์โหลดแล้วหา metadata ที่ซ่อนอยู่',
    description_en: 'This image looks ordinary, but something is hidden that you cannot see.\nDownload it and find the hidden metadata.',
    category: 'FOR', difficulty: 'Easy', base_points: 100,
    flag: 'flag{bef449197a983758d49a626bd3bef897}',
    attachment_url: '/challenges/hidden-metadata.jpg',
    hints: [
      { text_th: 'ไฟล์รูปมี EXIF metadata ซ่อนอยู่', text_en: 'Image files can have hidden EXIF metadata', penalty_pct: 0 },
      { text_th: 'ใช้ exiftool หรือ python piexif', text_en: 'Use exiftool or python piexif', penalty_pct: 25 },
      { text_th: 'exiftool hidden-metadata.jpg → User Comment', text_en: 'exiftool hidden-metadata.jpg → User Comment', penalty_pct: 50 },
    ],
    solution_th: 'exiftool hidden-metadata.jpg | grep "User Comment"',
    visible: true,
  },
  {
    title_th: 'ไฟล์ปลอมตัว', title_en: 'File Disguise',
    description_th: 'นี่คือ "รูปถ่ายวันหยุด" ของเพื่อนคุณ\nแต่ทำไมมันถึงดูแปลกๆ?\n\nดาวน์โหลดแล้วลองหาว่าจริงๆ แล้วคืออะไร',
    description_en: "This is your friend's vacation photo.\nBut why does it seem strange?\n\nDownload it and find out what it really is.",
    category: 'FOR', difficulty: 'Medium', base_points: 300,
    flag: 'flag{28baa517161a68dae9111310ae1099cb}',
    attachment_url: '/challenges/photo_vacation.jpg',
    hints: [
      { text_th: 'ลอง: file photo_vacation.jpg', text_en: 'Try: file photo_vacation.jpg', penalty_pct: 0 },
      { text_th: 'Magic bytes ของ ZIP คือ PK (0x504B)', text_en: 'ZIP files start with PK magic bytes', penalty_pct: 25 },
      { text_th: 'unzip photo_vacation.jpg', text_en: 'unzip photo_vacation.jpg', penalty_pct: 50 },
    ],
    solution_th: 'file → Zip archive → unzip → cat flag.txt',
    visible: true,
  },
  // ── WEB ──
  {
    title_th: 'คุกกี้มอนสเตอร์', title_en: 'Cookie Monster',
    description_th: 'เว็บนี้มีของขวัญซ่อนอยู่สำหรับคุณ 🍪\n\n1. ไปที่ `/api/challenge/cookie?locale=th`\n2. เปิด DevTools (F12) → Application → Cookies\n3. decode ค่าใน `session_token`',
    description_en: 'This website has a hidden gift for you 🍪\n\n1. Visit `/api/challenge/cookie?locale=en`\n2. Open DevTools (F12) → Application → Cookies\n3. Decode the value in `session_token`',
    category: 'WEB', difficulty: 'Easy', base_points: 100,
    flag: 'flag{b13ed3441e10af450d63360a5e6f1b82}',
    hints: [
      { text_th: 'Cookie คือข้อมูลที่เว็บเก็บในเบราว์เซอร์', text_en: 'Cookies are data stored in your browser', penalty_pct: 0 },
      { text_th: 'ค่าที่เห็นลงท้าย == → Base64', text_en: 'Value ending with == → Base64', penalty_pct: 25 },
    ],
    solution_th: 'session_token cookie → Base64 decode → flag',
    visible: true,
  },
  {
    title_th: 'หุ่นยนต์บอกทาง', title_en: 'robots.txt',
    description_th: 'เว็บทุกเว็บมีไฟล์พิเศษที่บอก Search Engine ว่าห้ามเข้าที่ไหน\nลองดูที่ `/robots.txt` แล้วทำตามที่มันบอก',
    description_en: 'Every website has a file that tells Search Engines which paths to avoid.\nCheck `/robots.txt` and follow what it says.',
    category: 'WEB', difficulty: 'Medium', base_points: 300,
    flag: 'flag{d4078fd0f999e68088896142089c4baf}',
    hints: [
      { text_th: '/robots.txt มีในทุกเว็บ', text_en: '/robots.txt exists on most websites', penalty_pct: 0 },
      { text_th: 'ดู Disallow: paths แล้วเข้าดูตรงๆ', text_en: 'Check Disallow: paths and visit them', penalty_pct: 25 },
    ],
    solution_th: '/robots.txt → Disallow: /secret-vault-7f3a9d/ → visit it → flag',
    visible: true,
  },
]

// Patches for already-seeded challenges (description + solution corrections)
const PATCHES = [
  {
    title_en: 'Hello CTF',
    solution_th: 'Base64 decode → flag{f84e0b10bf719f0f47aa9dbaecb1e9f4}',
  },
  {
    title_en: 'Binary Breakfast',
    solution_th: "''.join(chr(int(b,2)) for b in bits.split()) → flag{f0815c113e766896940e9579089968b1}",
  },
  {
    title_en: "Caesar's Ghost",
    description_th: 'จักรพรรดิ Caesar ใช้รหัสลับที่ง่ายมาก\nช่วยถอดรหัสข้อความนี้:\n\n```\nsynt{26r720122sr34oro1o49rq96264rn86s}\n```',
    description_en: "Julius Caesar used a simple cipher.\nDecode this:\n\n```\nsynt{26r720122sr34oro1o49rq96264rn86s}\n```",
    solution_th: 'codecs.decode("synt{26r720122sr34oro1o49rq96264rn86s}", "rot_13") → flag{26e720122fe34beb1b49ed96264ea86f}',
  },
  {
    title_en: 'Base Not Found',
    solution_th: 'Base64 → Base32 → flag{467605cfbcc845d1e50b1ccd1442df64}',
  },
  {
    title_en: 'Emoji Cipher',
    solution_th: "''.join(chr(ord(e)-0x1F600+32) for e in emojis) → flag{3df627ef949c6047e937e3dc4a11b3f1}",
  },
  {
    title_en: 'XOR Warrior',
    description_th: 'XOR คืออาวุธลับของ cryptographer\nถอดรหัส hex string นี้ด้วย single-byte key:\n\n```\n242e23253973237a7127202124717a26757a7b7a207a7a21277777722072727624777072763f\n```',
    description_en: 'XOR is the secret weapon of cryptographers.\nDecrypt this hex with a single-byte key:\n\n```\n242e23253973237a7127202124717a26757a7b7a207a7a21277777722072727624777072763f\n```',
    solution_th: 'key = 0x42\nbytes(b ^ 0x42 for b in bytes.fromhex("...")).decode() → flag{1a83ebcf38d7898b88ce550b004f5204}',
  },
  {
    title_en: 'Morse in the Dark',
    solution_th: 'Morse decode → flag{e1ebc82566077b543d0d5dea45849d6b}',
  },
  {
    title_en: 'Chain Reaction',
    solution_th: "Base64 → reverse → flag{6b5e86ed3fc1c0daaa100f211182ba31}",
  },
  {
    title_en: 'Hidden in Plain Sight',
    solution_th: 'exiftool hidden-metadata.jpg | grep "User Comment" → flag{bef449197a983758d49a626bd3bef897}',
  },
  {
    title_en: 'File Disguise',
    solution_th: 'file → Zip archive → unzip → cat flag.txt → flag{28baa517161a68dae9111310ae1099cb}',
  },
  {
    title_en: 'Cookie Monster',
    solution_th: 'session_token cookie → Base64 decode → flag{b13ed3441e10af450d63360a5e6f1b82}',
  },
  {
    title_en: 'robots.txt',
    solution_th: '/robots.txt → Disallow: /secret-vault-7f3a9d/ → visit it → flag{d4078fd0f999e68088896142089c4baf}',
  },
]

export default function SeedPage() {
  const { profile, user } = useAuth()
  const { locale } = useParams()
  const router = useRouter()
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [log, setLog] = useState<string[]>([])
  const [count, setCount] = useState(0)
  const [patchStatus, setPatchStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [deleteStatus, setDeleteStatus] = useState<'idle' | 'running' | 'done'>('idle')
  const [deleteCount, setDeleteCount] = useState(0)
  const [resetStatus, setResetStatus] = useState<'idle' | 'running' | 'done'>('idle')

  if (profile?.role !== 'coach') return (
    <div className="text-center py-16 space-y-2 font-mono text-sm">
      <div className="text-red-400">Access denied</div>
      <div className="text-gray-500">uid: {user?.uid || 'not logged in'}</div>
      <div className="text-gray-500">role: {profile?.role || 'no profile'}</div>
    </div>
  )

  const addLog = (msg: string) => setLog(l => [...l, msg])

  const runSeed = async () => {
    setStatus('running')
    setLog([])
    try {
      const currentUser = auth.currentUser
      addLog(`auth.currentUser: ${currentUser?.uid || 'null'}`)
      addLog(`profile.role: ${profile?.role}`)
      if (!currentUser) {
        addLog('❌ ไม่มี auth session — ลอง reload แล้ว login ใหม่')
        setStatus('error')
        return
      }
      // Force-refresh token to ensure Firestore has valid credentials
      await currentUser.getIdToken(true)
      addLog('token refreshed ✓')
      const snap = await getCountFromServer(collection(db, 'challenges'))
      const existingCount = snap.data().count
      if (existingCount > 0) {
        addLog(`⚠️  มีโจทย์อยู่แล้ว ${existingCount} ข้อ — ลบก่อนถึงจะ seed ใหม่ได้`)
        setStatus('error')
        return
      }
      for (const ch of CHALLENGES) {
        const { flag, ...rest } = ch as any
        const flag_hash = await sha256(flag)
        await addDoc(collection(db, 'challenges'), {
          ...rest,
          flag_hash,
          current_points: ch.base_points,
          solve_count: 0,
          first_blood_uid: null,
          second_blood_uid: null,
          third_blood_uid: null,
          created_at: serverTimestamp(),
        })
        setCount(c => c + 1)
        addLog(`✓ ${ch.title_en} [${ch.category}/${ch.difficulty}]`)
      }
      addLog(`\n✅ เสร็จแล้ว! ${CHALLENGES.length} โจทย์`)
      setStatus('done')
    } catch (e: any) {
      addLog(`❌ Error: ${e.message}`)
      setStatus('error')
    }
  }

  const runDeleteAll = async () => {
    if (!confirm('⚠️ ลบโจทย์ทั้งหมดออกจาก Firestore? ไม่สามารถกู้คืนได้!')) return
    setDeleteStatus('running')
    setDeleteCount(0)
    try {
      const currentUser = auth.currentUser
      if (!currentUser) { setDeleteStatus('idle'); return }
      await currentUser.getIdToken(true)
      const snap = await getDocs(collection(db, 'challenges'))
      let n = 0
      for (const d of snap.docs) {
        await deleteDoc(d.ref)
        n++
        setDeleteCount(n)
      }
      addLog(`🗑️ ลบแล้ว ${n} โจทย์`)
      setDeleteStatus('done')
      setStatus('idle')
    } catch (e: any) {
      addLog(`❌ Delete error: ${e.message}`)
      setDeleteStatus('idle')
    }
  }

  const runReset = async () => {
    if (!confirm('⚠️ Reset ทุกอย่างกลับเป็น 0? (คะแนน, ประวัติ, firstblood ทั้งหมด — ไม่ลบ user)')) return
    setResetStatus('running')
    try {
      const currentUser = auth.currentUser
      if (!currentUser) { setResetStatus('idle'); return }
      await currentUser.getIdToken(true)

      // 1. Delete all submissions
      const subSnap = await getDocs(collection(db, 'submissions'))
      for (const d of subSnap.docs) await deleteDoc(d.ref)
      addLog(`🗑️ submissions: ลบ ${subSnap.size} รายการ`)

      // 2. Delete all hints_used
      const hintSnap = await getDocs(collection(db, 'hints_used'))
      for (const d of hintSnap.docs) await deleteDoc(d.ref)
      addLog(`🗑️ hints_used: ลบ ${hintSnap.size} รายการ`)

      // 3. Reset challenges (solve_count, blood, current_points → base_points)
      const chalSnap = await getDocs(collection(db, 'challenges'))
      for (const d of chalSnap.docs) {
        await updateDoc(d.ref, {
          solve_count: 0,
          first_blood_uid: null,
          second_blood_uid: null,
          third_blood_uid: null,
          current_points: d.data().base_points,
        })
      }
      addLog(`✓ challenges: reset ${chalSnap.size} โจทย์`)

      // 4. Reset user profiles (keep user, clear scores)
      const userSnap = await getDocs(collection(db, 'users'))
      for (const d of userSnap.docs) {
        await updateDoc(d.ref, {
          total_points: 0,
          solved_challenges: [],
          first_bloods: 0,
          hints_used: 0,
          hints_penalty_total: 0,
          first_solve_time: null,
        })
      }
      addLog(`✓ users: reset ${userSnap.size} คน`)
      addLog('✅ Reset เสร็จแล้ว!')
      setResetStatus('done')
    } catch (e: any) {
      addLog(`❌ Reset error: ${e.message}`)
      setResetStatus('idle')
    }
  }

  const runPatch = async () => {
    setPatchStatus('running')
    try {
      const currentUser = auth.currentUser
      if (!currentUser) { setPatchStatus('error'); return }
      await currentUser.getIdToken(true)
      for (const patch of PATCHES) {
        const q = query(collection(db, 'challenges'), where('title_en', '==', patch.title_en))
        const snap = await getDocs(q)
        if (snap.empty) {
          addLog(`⚠️  ไม่พบ: ${patch.title_en}`)
        } else {
          const { title_en, ...fields } = patch
          await updateDoc(snap.docs[0].ref, fields)
          addLog(`✓ patched: ${patch.title_en}`)
        }
      }
      addLog('✅ Patch เสร็จแล้ว')
      setPatchStatus('done')
    } catch (e: any) {
      addLog(`❌ Patch error: ${e.message}`)
      setPatchStatus('error')
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push(`/${locale}/coach`)} className="text-gray-500 hover:text-gray-300 text-sm">← กลับ</button>
        <h1 className="text-xl font-bold text-cyan-400">Seed Challenges</h1>
      </div>

      <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 text-sm text-yellow-300">
        ⚠️ หน้านี้ใช้ครั้งเดียว — เพิ่มโจทย์ทั้ง {CHALLENGES.length} ข้อเข้า Firestore<br />
        ถ้ามีโจทย์อยู่แล้วจะหยุดอัตโนมัติ
      </div>

      <div className="grid grid-cols-3 gap-3 text-center text-xs">
        {['GEN','CRYPTO','MISC','FOR','WEB','REV'].map(cat => {
          const n = CHALLENGES.filter(c => c.category === cat).length
          return (
            <div key={cat} className="bg-gray-900 border border-gray-700 rounded-lg p-3">
              <div className="font-mono text-cyan-400">{cat}</div>
              <div className="text-gray-400">{n} โจทย์</div>
            </div>
          )
        })}
      </div>

      {status === 'idle' && (
        <button
          onClick={runSeed}
          className="w-full bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold py-3 rounded-lg transition-colors"
        >
          เริ่ม Seed {CHALLENGES.length} โจทย์
        </button>
      )}

      {status === 'running' && (
        <div className="text-center text-cyan-400 py-4">
          กำลัง seed... ({count}/{CHALLENGES.length})
        </div>
      )}

      {status === 'done' && (
        <div className="flex gap-3">
          <div className="flex-1 bg-green-900/20 border border-green-700 text-green-400 rounded-lg p-3 text-sm text-center">
            ✅ Seed สำเร็จ!
          </div>
          <button
            onClick={() => router.push(`/${locale}/coach`)}
            className="bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold px-6 rounded-lg"
          >
            ไปดู Dashboard
          </button>
        </div>
      )}

      {log.length > 0 && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 font-mono text-xs text-gray-300 space-y-0.5 max-h-72 overflow-y-auto">
          {log.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      )}

      <div className="border-t border-gray-700 pt-6">
        <button
          onClick={() => router.push(`/${locale}/coach/seed2`)}
          className="w-full bg-blue-700 hover:bg-blue-600 text-white font-bold py-2 rounded-lg transition-colors text-sm mb-6"
        >
          📦 ไปที่ Seed Batch 2 (56 โจทย์ใหม่)
        </button>
      </div>

      <div className="border-t border-gray-700 pt-6 space-y-3">
        <div className="text-sm text-gray-400">
          <span className="text-red-400 font-bold">Danger Zone</span>
        </div>
        <button
          onClick={runReset}
          disabled={resetStatus === 'running'}
          className="w-full bg-orange-900 hover:bg-orange-800 border border-orange-700 text-orange-300 font-bold py-2 rounded-lg transition-colors text-sm disabled:opacity-40"
        >
          {resetStatus === 'running' ? 'กำลัง reset...' : resetStatus === 'done' ? '✅ Reset เสร็จแล้ว!' : '🔄 Reset การแข่งขัน (คะแนน/ประวัติ/Firstblood → 0)'}
        </button>
        <button
          onClick={runDeleteAll}
          disabled={deleteStatus === 'running'}
          className="w-full bg-red-900 hover:bg-red-800 border border-red-700 text-red-300 font-bold py-2 rounded-lg transition-colors text-sm disabled:opacity-40"
        >
          {deleteStatus === 'running' ? `กำลังลบ... (${deleteCount})` : deleteStatus === 'done' ? '✅ ลบทั้งหมดแล้ว — กด Seed ใหม่ได้' : '🗑️ Delete All Challenges (ลบโจทย์ทั้งหมด)'}
        </button>
      </div>

      <div className="border-t border-gray-700 pt-6 space-y-3">
        <div className="text-sm text-gray-400">
          <span className="text-yellow-400 font-bold">Fix Mode</span> — อัปเดต solution ทุกข้อให้แสดง flag ชัดเจน
        </div>
        {patchStatus !== 'running' && (
          <button
            onClick={runPatch}
            className="w-full bg-yellow-600 hover:bg-yellow-500 text-gray-950 font-bold py-2 rounded-lg transition-colors text-sm"
          >
            {patchStatus === 'done' ? '✅ Patched!' : 'Patch All Solutions (แสดง flag ทุกข้อ)'}
          </button>
        )}
        {patchStatus === 'running' && (
          <div className="text-center text-yellow-400 text-sm py-2">กำลัง patch...</div>
        )}
      </div>
    </div>
  )
}

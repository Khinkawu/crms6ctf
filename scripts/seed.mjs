/**
 * CRMS6 CTF — Challenge Seed Script
 * Usage: node scripts/seed.mjs <coach-email> <coach-password>
 * Run once after setting up Firebase Auth and setting role:'coach' on your user doc.
 */
import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { getFirestore, collection, addDoc, getDocs, query, where } from 'firebase/firestore'
import { readFileSync } from 'fs'
import { createHash } from 'crypto'

// Load env
const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n')
    .filter(l => l.includes('='))
    .map(l => l.split('=').map(s => s.trim()))
)

const app = initializeApp({
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
})

const auth = getAuth(app)
const db = getFirestore(app)

const sha256 = s => createHash('sha256').update(s.trim().toLowerCase()).digest('hex')

// ─── Challenge Data ───────────────────────────────────────────────
const CHALLENGES = [
  // ── GEN ──
  {
    title_th: 'สวัสดี CTF',
    title_en: 'Hello CTF',
    description_th: 'ยินดีต้อนรับสู่ CRMS6 CTF!\n\nมีข้อมูลที่ถูกซ่อนไว้ในรูปแบบ Base64 ด้านล่าง\nถอดรหัสมันเพื่อรับ flag\n\n```\nZmxhZ3tmODRlMGIxMGJmNzE5ZjBmNDdhYTlkYmFlY2IxZTlmNH0=\n```',
    description_en: 'Welcome to CRMS6 CTF!\n\nSomething is encoded below. Decode it to get the flag.\n\n```\nZmxhZ3tmODRlMGIxMGJmNzE5ZjBmNDdhYTlkYmFlY2IxZTlmNH0=\n```',
    category: 'GEN', difficulty: 'Easy', base_points: 100,
    flag: 'flag{f84e0b10bf719f0f47aa9dbaecb1e9f4}',
    hints: [
      { text_th: 'Base64 คือระบบเข้ารหัสที่ใช้ตัวอักษร A-Z, a-z, 0-9, +, /', text_en: 'Base64 uses A-Z, a-z, 0-9, +, / characters', penalty_pct: 0 },
      { text_th: 'python3 -c "import base64; print(base64.b64decode(\'...\').decode())"', text_en: 'python3 -c "import base64; print(base64.b64decode(\'...\').decode())"', penalty_pct: 25 },
    ],
    solution_th: 'Base64 decode: flag{f84e0b10bf719f0f47aa9dbaecb1e9f4}\npython: base64.b64decode("ZmxhZ3tm...").decode()',
    visible: true,
  },
  {
    title_th: 'อาหารเช้า Binary',
    title_en: 'Binary Breakfast',
    description_th: 'เลข 0 และ 1 คือภาษาของคอมพิวเตอร์\nแปลงข้อความด้านล่างให้เป็น flag\n\n```\n01100110 01101100 01100001 01100111 01111011 01100110 00110000 00111000 00110001 00110101 01100011 00110001 00110001 00110011 01100101 00110111 00110110 00110110 00111000 00111001 00110110 00111001 00110100 00110000 01100101 00111001 00110101 00110111 00111001 00110000 00111000 00111001 00111001 00110110 00111000 01100010 00110001 01111101\n```',
    description_en: 'The language of computers is 0 and 1.\nConvert the binary below to get the flag.\n\n```\n01100110 01101100 01100001 01100111 01111011 01100110 00110000 00111000 00110001 00110101 01100011 00110001 00110001 00110011 01100101 00110111 00110110 00110110 00111000 00111001 00110110 00111001 00110100 00110000 01100101 00111001 00110101 00110111 00111001 00110000 00111000 00111001 00111001 00110110 00111000 01100010 00110001 01111101\n```',
    category: 'GEN', difficulty: 'Easy', base_points: 100,
    flag: 'flag{f0815c113e766896940e9579089968b1}',
    hints: [
      { text_th: 'แต่ละกลุ่ม 8 bits = 1 ตัวอักษร (ASCII)', text_en: 'Each group of 8 bits = 1 ASCII character', penalty_pct: 0 },
      { text_th: 'python: chr(int("01100110", 2)) = "f"', text_en: 'python: chr(int("01100110", 2)) = "f"', penalty_pct: 25 },
    ],
    solution_th: "bits = '01100110 ...'.split()\n''.join(chr(int(b,2)) for b in bits)",
    visible: true,
  },

  // ── CRYPTO ──
  {
    title_th: 'Caesar',
    title_en: "Caesar's Ghost",
    description_th: 'จักรพรรดิ Caesar ใช้รหัสลับที่ง่ายมาก\nช่วยถอดรหัสข้อความนี้:\n\n```\nsynt{26r720122sr34oро1о49rq96264рn86s}\n```\n\nหมายเหตุ: flag format คือ flag{...}',
    description_en: "Julius Caesar used a simple cipher.\nDecode this message:\n\n```\nsynt{26r720122sr34oro1o49rq96264rn86s}\n```\n\nNote: flag format is flag{...}",
    category: 'CRYPTO', difficulty: 'Easy', base_points: 100,
    flag: 'flag{26e720122fe34beb1b49ed96264ea86f}',
    hints: [
      { text_th: 'ROT13 คือ Caesar shift = 13', text_en: 'ROT13 is Caesar with shift = 13', penalty_pct: 0 },
      { text_th: 'python: import codecs; codecs.decode("synt{...}", "rot_13")', text_en: 'python: import codecs; codecs.decode("synt{...}", "rot_13")', penalty_pct: 25 },
      { text_th: 'CyberChef → ROT13', text_en: 'CyberChef → ROT13', penalty_pct: 50 },
    ],
    solution_th: 'ROT13: synt → flag\ncodecs.decode("synt{26r720122sr34oro1o49rq96264rn86s}", "rot_13")',
    visible: true,
  },
  {
    title_th: 'ฐานไม่พบ',
    title_en: 'Base Not Found',
    description_th: 'ข้อความนี้ถูกเข้ารหัสหลายชั้น ลองถอดดู:\n\n```\nTVpXR0NaMzNHUTNET05SUUdWUldNWVRETU00RElOTEVHRlNUS01EQ0dGUldHWkJSR1EyREVaREdHWTJIMj09PQ==\n```',
    description_en: 'This text is encoded in multiple layers. Can you peel them all?\n\n```\nTVpXR0NaMzNHUTNET05SUUdWUldNWVRETU00RElOTEVHRlNUS01EQ0dGUldHWkJSR1EyREVaREdHWTJIMj09PQ==\n```',
    category: 'CRYPTO', difficulty: 'Easy', base_points: 100,
    flag: 'flag{467605cfbcc845d1e50b1ccd1442df64}',
    hints: [
      { text_th: 'ลงท้าย == หมายถึงอะไร?', text_en: 'What does ending with == mean?', penalty_pct: 0 },
      { text_th: 'decode Base64 ก่อน แล้วดูผลลัพธ์ว่าเป็น encoding อะไร', text_en: 'Decode Base64 first, then identify what the result is', penalty_pct: 25 },
      { text_th: 'Base64 → Base32 → plain text', text_en: 'Base64 → Base32 → plain text', penalty_pct: 50 },
    ],
    solution_th: "import base64\nstep1 = base64.b64decode('TVpXR...')\nflag = base64.b32decode(step1).decode()",
    visible: true,
  },
  {
    title_th: 'อีโมจิพูดได้',
    title_en: 'Emoji Cipher',
    description_th: 'อีโมจิเหล่านี้ซ่อน flag ไว้\nหา pattern แล้วถอดรหัส:\n\n```\n🙆🙌🙁🙇🙛😓🙄🙆😖😒😗🙅🙆😙😔😙🙃😖😐😔😗🙅😙😓😗🙅😓🙄🙃😔🙁😑😑🙂😓🙆😑🙝\n```',
    description_en: 'These emojis hide a flag.\nFind the pattern and decode:\n\n```\n🙆🙌🙁🙇🙛😓🙄🙆😖😒😗🙅🙆😙😔😙🙃😖😐😔😗🙅😙😓😗🙅😓🙄🙃😔🙁😑😑🙂😓🙆😑🙝\n```',
    category: 'CRYPTO', difficulty: 'Medium', base_points: 300,
    flag: 'flag{3df627ef949c6047e937e3dc4a11b3f1}',
    hints: [
      { text_th: 'สังเกต Unicode code point ของแต่ละ emoji', text_en: 'Look at the Unicode code points of each emoji', penalty_pct: 0 },
      { text_th: '😀 คือ U+1F600. offset จาก 😀 = ตัวอักษร ASCII + 32', text_en: '😀 is U+1F600. Offset from 😀 + 32 = ASCII char', penalty_pct: 25 },
      { text_th: "chr(ord(emoji) - 0x1F600 + 32)", text_en: "chr(ord(emoji) - 0x1F600 + 32)", penalty_pct: 50 },
    ],
    solution_th: "''.join(chr(ord(e) - 0x1F600 + 32) for e in emojis)",
    visible: true,
  },
  {
    title_th: 'นักรบ XOR',
    title_en: 'XOR Warrior',
    description_th: 'XOR คืออาวุธลับของ cryptographer\nถอดรหัส hex string นี้:\n\n```\n242e23253973237a7127202124717a26757a7b7a202c71201c352920347a2024247a7120343b7a2125352024211920202120207a21\n```\n\nKey ซ่อนอยู่ในรูปแบบ single byte',
    description_en: 'XOR is the secret weapon of cryptographers.\nDecrypt this hex string:\n\n```\n242e23253973237a7127202124717a26757a7b7a202c71201c352920347a2024247a7120343b7a2125352024211920202120207a21\n```\n\nThe key is a single byte.',
    category: 'CRYPTO', difficulty: 'Hard', base_points: 500,
    flag: 'flag{1a83ebcf38d7898b88ce550b004f5204}',
    hints: [
      { text_th: 'XOR brute force: ลอง key ทุกค่า 0x00-0xFF', text_en: 'XOR brute force: try every key from 0x00 to 0xFF', penalty_pct: 0 },
      { text_th: 'flag ที่ถูกต้องจะขึ้นต้นด้วย "flag{"', text_en: 'A valid flag starts with "flag{"', penalty_pct: 25 },
      { text_th: "bytes(b ^ 0x42 for b in bytes.fromhex('...'))", text_en: "bytes(b ^ 0x42 for b in bytes.fromhex('...'))", penalty_pct: 50 },
    ],
    solution_th: "data = bytes.fromhex('242e...')\nbytes(b ^ 0x42 for b in data).decode()\n# flag{1a83ebcf38d7898b88ce550b004f5204}",
    visible: true,
  },

  // ── MISC ──
  {
    title_th: 'มอร์สในความมืด',
    title_en: 'Morse in the Dark',
    description_th: '... --- ...\nถอดรหัสโค้ดมอร์สด้านล่าง:\n\n```\n. .---- . -... -.-. ---.. ..--- ..... -.... -.... ----- --... --... -... ..... ....- ...-- -.. ----- -.. ..... -.. . .- ....- ..... ---.. ....- ----. -.. -.... -...\n```\n\nflag format: flag{morse_content}',
    description_en: '... --- ...\nDecode the Morse code below:\n\n```\n. .---- . -... -.-. ---.. ..--- ..... -.... -.... ----- --... --... -... ..... ....- ...-- -.. ----- -.. ..... -.. . .- ....- ..... ---.. ....- ----. -.. -.... -...\n```\n\nflag format: flag{morse_content}',
    category: 'MISC', difficulty: 'Easy', base_points: 100,
    flag: 'flag{e1ebc82566077b543d0d5dea45849d6b}',
    hints: [
      { text_th: '. = dit, - = dah, ช่องว่าง = คั่นตัวอักษร', text_en: '. = dit, - = dah, space = letter separator', penalty_pct: 0 },
      { text_th: 'ใช้ dcode.fr/en/morse-code ถอดรหัส', text_en: 'Use dcode.fr/en/morse-code to decode', penalty_pct: 25 },
    ],
    solution_th: 'Morse decode ส่วนใน {} แล้วใส่กลับใน flag{...}',
    visible: true,
  },
  {
    title_th: 'ปฏิกิริยาลูกโซ่',
    title_en: 'Chain Reaction',
    description_th: 'บางอย่างถูกเข้ารหัสหลายขั้นตอน — ลอกชั้นออกทีละชั้น:\n\n```\nfTEzYWIyODExMTJmMDAxYWFhZDBjMWNmM2RlNjhlNWI2e2dhbGY=\n```\n\nมีกี่ขั้นตอน? นั่นคือส่วนหนึ่งของปริศนา',
    description_en: 'Something has been encoded in multiple steps — peel each layer:\n\n```\nfTEzYWIyODExMTJmMDAxYWFhZDBjMWNmM2RlNjhlNWI2e2dhbGY=\n```\n\nHow many steps? That is part of the puzzle.',
    category: 'MISC', difficulty: 'Medium', base_points: 300,
    flag: 'flag{6b5e86ed3fc1c0daaa100f211182ba31}',
    hints: [
      { text_th: 'ลงท้าย = หมายถึงอะไร?', text_en: 'What does ending with = mean?', penalty_pct: 0 },
      { text_th: 'หลัง decode step แรก ลองอ่านผลลัพธ์จากท้ายไปหน้า', text_en: 'After the first decode, try reading the result backwards', penalty_pct: 25 },
      { text_th: 'Base64 decode → reverse → flag', text_en: 'Base64 decode → reverse → flag', penalty_pct: 50 },
    ],
    solution_th: "import base64\nstep1 = base64.b64decode('fTEzYWI...').decode()\nflag = step1[::-1]",
    visible: true,
  },

  // ── FOR ──
  {
    title_th: 'ซ่อนในภาพ',
    title_en: 'Hidden in Plain Sight',
    description_th: 'ภาพนี้ดูธรรมดา แต่มีบางอย่างซ่อนอยู่ที่คุณมองไม่เห็นด้วยตาเปล่า\nดาวน์โหลดภาพแล้วหา metadata ที่ซ่อนอยู่',
    description_en: 'This image looks ordinary, but something is hidden that you cannot see with the naked eye.\nDownload the image and find the hidden metadata.',
    category: 'FOR', difficulty: 'Easy', base_points: 100,
    flag: 'flag{bef449197a983758d49a626bd3bef897}',
    attachment_url: '/challenges/hidden-metadata.jpg',
    hints: [
      { text_th: 'ไฟล์รูปมีข้อมูลพิเศษซ่อนอยู่ใน EXIF', text_en: 'Image files can contain hidden data in EXIF metadata', penalty_pct: 0 },
      { text_th: 'ใช้ exiftool หรือ python: exifread', text_en: 'Use exiftool or python: exifread', penalty_pct: 25 },
      { text_th: 'exiftool hidden-metadata.jpg → ดูที่ User Comment', text_en: 'exiftool hidden-metadata.jpg → check User Comment field', penalty_pct: 50 },
    ],
    solution_th: 'exiftool hidden-metadata.jpg | grep "User Comment"\nหรือ python piexif: data["Exif"][37510]',
    visible: true,
  },
  {
    title_th: 'ไฟล์ปลอมตัว',
    title_en: 'File Disguise',
    description_th: 'นี่คือ "รูปถ่ายวันหยุด" ของเพื่อนคุณ\nแต่ทำไมมันถึงดูแปลกๆ?\n\nดาวน์โหลดไฟล์แล้วลองหาว่าจริงๆ แล้วคืออะไร',
    description_en: "This is your friend's vacation photo.\nBut why does it seem strange?\n\nDownload the file and find out what it really is.",
    category: 'FOR', difficulty: 'Medium', base_points: 300,
    flag: 'flag{28baa517161a68dae9111310ae1099cb}',
    attachment_url: '/challenges/photo_vacation.jpg',
    hints: [
      { text_th: 'ลอง: file photo_vacation.jpg', text_en: 'Try: file photo_vacation.jpg', penalty_pct: 0 },
      { text_th: 'Magic bytes ของ ZIP คือ PK (0x504B)', text_en: 'ZIP files start with PK magic bytes (0x504B)', penalty_pct: 25 },
      { text_th: 'unzip photo_vacation.jpg', text_en: 'unzip photo_vacation.jpg', penalty_pct: 50 },
    ],
    solution_th: 'file photo_vacation.jpg → Zip archive\nunzip photo_vacation.jpg\ncat flag.txt',
    visible: true,
  },

  // ── WEB ──
  {
    title_th: 'คุกกี้มอนสเตอร์',
    title_en: 'Cookie Monster',
    description_th: 'เว็บนี้มีของขวัญซ่อนอยู่สำหรับคุณ 🍪\n\n**ขั้นตอน:**\n1. ไปที่ `/api/challenge/cookie?locale=th`\n2. เปิด DevTools (F12) → Application → Cookies\n3. decode ค่าที่เจอใน cookie `session_token`',
    description_en: 'This website has a hidden gift for you 🍪\n\n**Steps:**\n1. Visit `/api/challenge/cookie?locale=en`\n2. Open DevTools (F12) → Application → Cookies\n3. Decode the value in `session_token` cookie',
    category: 'WEB', difficulty: 'Easy', base_points: 100,
    flag: 'flag{b13ed3441e10af450d63360a5e6f1b82}',
    hints: [
      { text_th: 'Cookie คือข้อมูลที่เว็บบันทึกไว้ในเบราว์เซอร์', text_en: 'Cookies are data stored in your browser by websites', penalty_pct: 0 },
      { text_th: 'ค่าที่เห็นใน cookie ลงท้าย == — Base64 คือคำตอบ', text_en: 'The cookie value ends with == — think Base64', penalty_pct: 25 },
    ],
    solution_th: '1. /api/challenge/cookie → redirect + set cookie\n2. session_token = ZmxhZ3...== → Base64 decode → flag',
    visible: true,
  },
  {
    title_th: 'หุ่นยนต์บอกทาง',
    title_en: 'robots.txt',
    description_th: 'เว็บทุกเว็บมีไฟล์พิเศษที่บอก Search Engine ว่าห้ามเข้าที่ไหน\nบางทีมันก็บอกนักสำรวจด้วยเช่นกัน\n\nลองดูที่: `/robots.txt`\nแล้วทำตามที่มันบอก',
    description_en: 'Every website has a special file that tells Search Engines which paths to avoid.\nSometimes it tells explorers the same thing.\n\nCheck: `/robots.txt`\nThen follow what it says.',
    category: 'WEB', difficulty: 'Medium', base_points: 300,
    flag: 'flag{d4078fd0f999e68088896142089c4baf}',
    hints: [
      { text_th: '/robots.txt คือ standard file ที่ทุกเว็บมี', text_en: '/robots.txt is a standard file on most websites', penalty_pct: 0 },
      { text_th: 'ดู Disallow: paths แล้วเข้าไปดูเอง', text_en: 'Check Disallow: paths and visit them yourself', penalty_pct: 25 },
    ],
    solution_th: '1. /robots.txt → Disallow: /secret-vault-7f3a9d/\n2. เข้า /secret-vault-7f3a9d/ → flag',
    visible: true,
  },
]

// ─── Main ─────────────────────────────────────────────────────────
async function main() {
  const [, , email, password] = process.argv
  if (!email || !password) {
    console.error('Usage: node scripts/seed.mjs <coach-email> <coach-password>')
    process.exit(1)
  }

  console.log(`Signing in as ${email}...`)
  await signInWithEmailAndPassword(auth, email, password)
  console.log('Signed in!')

  // Check for existing challenges
  const existing = await getDocs(collection(db, 'challenges'))
  if (existing.size > 0) {
    console.log(`⚠️  Found ${existing.size} existing challenge(s). Skipping to avoid duplicates.`)
    console.log('Delete all challenges in Firestore Console first if you want to re-seed.')
    process.exit(0)
  }

  console.log(`Seeding ${CHALLENGES.length} challenges...`)
  for (const ch of CHALLENGES) {
    const { flag, ...rest } = ch
    const flag_hash = sha256(flag)
    await addDoc(collection(db, 'challenges'), {
      ...rest,
      flag_hash,
      current_points: ch.base_points,
      solve_count: 0,
      first_blood_uid: null,
      second_blood_uid: null,
      third_blood_uid: null,
      created_at: new Date(),
    })
    console.log(`  ✓ ${ch.title_en} [${ch.category}/${ch.difficulty}]`)
  }

  console.log('\n✅ Done! All challenges seeded.')
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })

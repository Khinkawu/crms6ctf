'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'

async function sha256(text: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

interface HintData { text_th: string; text_en: string; penalty_pct: number }
interface ChallengeData {
  title_en: string; title_th: string
  description_en: string; description_th: string
  category: string; difficulty: string; base_points: number
  flag: string; hints: HintData[]; solution_th: string; visible: boolean
  attachment_url?: string
}

const CHALLENGES_2: ChallengeData[] = [
  {
    title_en: "Hex Genie", title_th: "\u0e22\u0e31\u0e01\u0e29\u0e4c\u0e40\u0e2e\u0e47\u0e01\u0e0b\u0e32\u0e40\u0e14\u0e0b\u0e34\u0e21\u0e2d\u0e25",
    description_en: `Someone left a message for you. Convert hex to text.

\`\`\`
666c61677b31346432653930653732383366343263363932623931363337663863363965397d
\`\`\``,
    description_th: `มีข้อความถูกเข้ารหัสเป็น Hex ด้านล่าง แปลงกลับเป็นข้อความ

\`\`\`
666c61677b31346432653930653732383366343263363932623931363337663863363965397d
\`\`\``,
    category: "GEN", difficulty: "Easy", base_points: 100,
    flag: "flag{14d2e90e7283f42c692b91637f8c69e9}",
    hints: [{"text_en": "Hex uses digits 0-9 and letters a-f", "text_th": "Hex ใช้ตัวเลข 0-9 และตัวอักษร a-f", "penalty_pct": 0}, {"text_en": "python: bytes.fromhex('...').decode()", "text_th": "python: bytes.fromhex('...').decode()", "penalty_pct": 25}],
    solution_th: "bytes.fromhex('666c61677b31346432653930653732383366343263363932623931363337663863363965397d').decode()",
    visible: true,
  },
  {
    title_en: "Octal Oracle", title_th: "\u0e19\u0e31\u0e01\u0e1e\u0e22\u0e32\u0e01\u0e23\u0e13\u0e4c\u0e10\u0e32\u0e19 8",
    description_en: `The oracle speaks in base 8. Decode to find the flag.

\`\`\`
146 154 141 147 173 142 66 146 145 143 143 62 66 70 71 141 67 63 146 67 60 61 141 70 141 142 60 70 61 144 66 64 67 67 60 67 65 175
\`\`\``,
    description_th: `นักพยากรณ์พูดเป็นฐาน 8 ถอดรหัสเพื่อหา flag

\`\`\`
146 154 141 147 173 142 66 146 145 143 143 62 66 70 71 141 67 63 146 67 60 61 141 70 141 142 60 70 61 144 66 64 67 67 60 67 65 175
\`\`\``,
    category: "GEN", difficulty: "Easy", base_points: 100,
    flag: "flag{b6fecc2689a73f701a8ab081d6477075}",
    hints: [{"text_en": "Octal = base 8, digits 0-7", "text_th": "Octal = ฐาน 8 ใช้ตัวเลข 0-7", "penalty_pct": 0}, {"text_en": "python: chr(int('154',8)) = 'l'", "text_th": "python: chr(int('154',8)) = 'l'", "penalty_pct": 25}],
    solution_th: "''.join(chr(int(x,8)) for x in '146 154 141 147 173 142 66 146 145 143 143 62 66 70 71 141 67 63 146 67 60 61 141 70 141 142 60 70 61 144 66 64 67 67 60 67 65 175'.split())",
    visible: true,
  },
  {
    title_en: "URL Escape Artist", title_th: "\u0e28\u0e34\u0e25\u0e1b\u0e34\u0e19\u0e2b\u0e19\u0e35\u0e1a\u0e19 URL",
    description_en: `This URL looks suspicious. Decode the percent-encoded string.

\`\`\`
flag%7B89b8e807d0055ed1d9307b52c8c8dc87%7D
\`\`\``,
    description_th: `URL นี้ดูน่าสงสัย ถอดรหัส percent-encoded string นี้

\`\`\`
flag%7B89b8e807d0055ed1d9307b52c8c8dc87%7D
\`\`\``,
    category: "GEN", difficulty: "Easy", base_points: 100,
    flag: "flag{89b8e807d0055ed1d9307b52c8c8dc87}",
    hints: [{"text_en": "%XX means ASCII code in hex", "text_th": "XX ใน %XX คือ ASCII code ในรูป hex", "penalty_pct": 0}, {"text_en": "python: urllib.parse.unquote('...')", "text_th": "python: urllib.parse.unquote('...')", "penalty_pct": 25}],
    solution_th: "urllib.parse.unquote('flag%7B89b8e807d0055ed1d9307b52c8c8dc87%7D')",
    visible: true,
  },
  {
    title_en: "Decimal Dance", title_th: "\u0e23\u0e30\u0e1a\u0e33\u0e15\u0e31\u0e27\u0e40\u0e25\u0e02",
    description_en: `Each number is a character. Convert ASCII decimal to text.

\`\`\`
102 108 97 103 123 52 57 54 49 98 101 98 57 57 54 50 102 56 55 99 102 50 101 54 99 52 50 57 50 101 48 53 55 48 99 98 55 125
\`\`\``,
    description_th: `แต่ละตัวเลขคือตัวอักษรหนึ่งตัว แปลง ASCII decimal เป็นข้อความ

\`\`\`
102 108 97 103 123 52 57 54 49 98 101 98 57 57 54 50 102 56 55 99 102 50 101 54 99 52 50 57 50 101 48 53 55 48 99 98 55 125
\`\`\``,
    category: "GEN", difficulty: "Easy", base_points: 100,
    flag: "flag{4961beb9962f87cf2e6c4292e0570cb7}",
    hints: [{"text_en": "ASCII: 102='f', 108='l', 97='a', 103='g'", "text_th": "ASCII: 102='f', 108='l', 97='a', 103='g'", "penalty_pct": 0}, {"text_en": "python: chr(102) = 'f'", "text_th": "python: chr(102) = 'f'", "penalty_pct": 25}],
    solution_th: "''.join(chr(int(x)) for x in '102 108 97 103 123 52 57 54 49 98 101 98 57 57 54 50 102 56 55 99 102 50 101 54 99 52 50 57 50 101 48 53 55 48 99 98 55 125'.split())",
    visible: true,
  },
  {
    title_en: "Base32 Bonanza", title_th: "\u0e40\u0e17\u0e28\u0e01\u0e32\u0e25 Base32",
    description_en: `Not Base64, but close. Decode this Base32 encoded string.

\`\`\`
MZWGCZ33HFTGCOLDMU3DAMZZGUYWGMRZHE4WMZDFGBQTIMJZG43TMMJZG5QX2===
\`\`\``,
    description_th: `ไม่ใช่ Base64 แต่คล้ายกัน ถอดรหัส Base32 string นี้

\`\`\`
MZWGCZ33HFTGCOLDMU3DAMZZGUYWGMRZHE4WMZDFGBQTIMJZG43TMMJZG5QX2===
\`\`\``,
    category: "GEN", difficulty: "Easy", base_points: 100,
    flag: "flag{9fa9ce603951c2999fde0a419776197a}",
    hints: [{"text_en": "Base32 uses A-Z and 2-7, ends with =", "text_th": "Base32 ใช้ A-Z และ 2-7 ลงท้ายด้วย =", "penalty_pct": 0}, {"text_en": "python: base64.b32decode('...').decode()", "text_th": "python: base64.b32decode('...').decode()", "penalty_pct": 25}],
    solution_th: "base64.b32decode('MZWGCZ33HFTGCOLDMU3DAMZZGUYWGMRZHE4WMZDFGBQTIMJZG43TMMJZG5QX2===').decode()",
    visible: true,
  },
  {
    title_en: "HTML Haunted", title_th: "\u0e1c\u0e35\u0e43\u0e19 HTML",
    description_en: `These HTML entities are haunted. Decode them.

\`\`\`
&#102;&#108;&#97;&#103;&#123;&#97;&#54;&#99;&#49;&#102;&#48;&#51;&#55;&#100;&#10...
\`\`\``,
    description_th: `HTML entities เหล่านี้มีผีอยู่ ถอดรหัสพวกมัน

\`\`\`
&#102;&#108;&#97;&#103;&#123;&#97;&#54;&#99;&#49;&#102;&#48;&#51;&#55;&#100;&#10...
\`\`\``,
    category: "GEN", difficulty: "Easy", base_points: 100,
    flag: "flag{a6c1f037df933e1838f6bd59f3a8f57f}",
    hints: [{"text_en": "&#XX; is an HTML entity = ASCII char XX", "text_th": "&#XX; คือ HTML entity = ตัวอักษร ASCII หมายเลข XX", "penalty_pct": 0}, {"text_en": "python: re.sub(r'&#(\\d+);', lambda m: chr(int(m.group(1))), s)", "text_th": "ใช้ re.sub เพื่อแปลงทุก entity", "penalty_pct": 25}],
    solution_th: "re.sub(r'&#(\\d+);', lambda m: chr(int(m.group(1))), encoded)",
    visible: true,
  },
  {
    title_en: "Pipeline Pro", title_th: "\u0e17\u0e48\u0e2d\u0e2a\u0e2d\u0e07\u0e0a\u0e31\u0e49\u0e19",
    description_en: `Two layers. First Hex, then Base64. Peel carefully.

\`\`\`
5a6d78685a3373335a575a6a4e6d45345a444d79595442695a6a63784d4449354e7a4d334e5455784e4455354e6a526c5958303d
\`\`\``,
    description_th: `สองชั้น ชั้นนอกสุด Hex ข้างในเป็น Base64 ลอกทีละชั้น

\`\`\`
5a6d78685a3373335a575a6a4e6d45345a444d79595442695a6a63784d4449354e7a4d334e5455784e4455354e6a526c5958303d
\`\`\``,
    category: "GEN", difficulty: "Medium", base_points: 300,
    flag: "flag{7efc6a8d32a0bf7102973755145964ea}",
    hints: [{"text_en": "Try decoding Hex first", "text_th": "ลอง decode Hex ก่อนเลย", "penalty_pct": 0}, {"text_en": "hex → get base64 string → decode base64", "text_th": "hex → ได้ base64 → decode base64", "penalty_pct": 25}, {"text_en": "base64.b64decode(bytes.fromhex(s))", "text_th": "base64.b64decode(bytes.fromhex(s))", "penalty_pct": 50}],
    solution_th: "base64.b64decode(bytes.fromhex('5a6d78685a3373335a575a6a4e6d45345a444d79595442695a6a63784d4449354e7a4d334e5455784e4455354e6a526c5958303d')).decode()",
    visible: true,
  },
  {
    title_en: "Backwards", title_th: "\u0e22\u0e49\u0e2d\u0e19\u0e2b\u0e25\u0e31\u0e07",
    description_en: `Read it backwards.

\`\`\`
}a3220dee40c275482c9df928555db8f9{galf
\`\`\``,
    description_th: `อ่านมันจากหลังไปหน้า

\`\`\`
}a3220dee40c275482c9df928555db8f9{galf
\`\`\``,
    category: "GEN", difficulty: "Easy", base_points: 100,
    flag: "flag{9f8bd555829fd9c284572c04eed0223a}",
    hints: [{"text_en": "The data looks almost like a flag... just backwards", "text_th": "ข้อมูลดูเหมือน flag เกือบๆ... แค่กลับหัว", "penalty_pct": 0}, {"text_en": "python: s[::-1]", "text_th": "python: s[::-1]", "penalty_pct": 25}],
    solution_th: "'}a3220dee40c275482c9df928555db8f9{galf'[::-1]",
    visible: true,
  },
  {
    title_en: "Space Invader", title_th: "\u0e1c\u0e39\u0e49\u0e1a\u0e38\u0e01\u0e23\u0e38\u0e01\u0e0a\u0e48\u0e2d\u0e07\u0e27\u0e48\u0e32\u0e07",
    description_en: `Remove the spaces and you shall see.

\`\`\`
f l a g { a b f d b 2 c 1 3 c 9 c 3 7 4 b 9 a 2 6 b d c d 4 9 c 6 0 f 4 7 }
\`\`\``,
    description_th: `ลบช่องว่างออกแล้วจะเห็น flag

\`\`\`
f l a g { a b f d b 2 c 1 3 c 9 c 3 7 4 b 9 a 2 6 b d c d 4 9 c 6 0 f 4 7 }
\`\`\``,
    category: "GEN", difficulty: "Easy", base_points: 100,
    flag: "flag{abfdb2c13c9c374b9a26bdcd49c60f47}",
    hints: [{"text_en": "What if you just remove all spaces?", "text_th": "ลองลบ space ทั้งหมดออก?", "penalty_pct": 0}],
    solution_th: "'f l a g { a b f d b 2 c 1 3 c 9 c 3 7 4 b 9 a 2 6 b d c d 4 9 c 6 0 f 4 7 }'.replace(' ','')",
    visible: true,
  },
  {
    title_en: "Triple Base", title_th: "\u0e2a\u0e32\u0e21\u0e0a\u0e31\u0e49\u0e19 Base64",
    description_en: `Base64... but three times.

\`\`\`
V20xNGFGb3pjekJhYWtFMVRtMUplRnBFWnpKT2JWbDVUVmRGTlU0eVJUQk5lbXQzVGxSb2JGcEVWWHBQVkdOM1dtNHdQUT09
\`\`\``,
    description_th: `Base64... แต่สามครั้ง

\`\`\`
V20xNGFGb3pjekJhYWtFMVRtMUplRnBFWnpKT2JWbDVUVmRGTlU0eVJUQk5lbXQzVGxSb2JGcEVWWHBQVkdOM1dtNHdQUT09
\`\`\``,
    category: "GEN", difficulty: "Medium", base_points: 300,
    flag: "flag{4f096b1d866f21a97a439058ed53970f}",
    hints: [{"text_en": "It ends with = which means Base64", "text_th": "ลงท้าย = หมายถึง Base64", "penalty_pct": 0}, {"text_en": "After one decode, still looks like base64...", "text_th": "Decode หนึ่งรอบแล้ว ยังเหมือน base64 อยู่...", "penalty_pct": 25}, {"text_en": "Decode Base64 three times total", "text_th": "Decode Base64 สามครั้งรวม", "penalty_pct": 50}],
    solution_th: "b64d=base64.b64decode; b64d(b64d(b64d('V20xNGFGb3pjekJhYWtFMVRtMUplRnBFWnpKT2JWbDVUVmRGTlU0eVJUQk5lbXQzVGxSb2JGcEVWWHBQVkdOM1dtNHdQUT09'))).decode()",
    visible: true,
  },
  {
    title_en: "Atbash Mirror", title_th: "\u0e01\u0e23\u0e30\u0e08\u0e01 Atbash",
    description_en: `In ancient times, Atbash reversed the Hebrew alphabet. Now it reverses ours.

\`\`\`
uozt{u54v3uuz076z3300937294104u698y50}
\`\`\``,
    description_th: `ในสมัยโบราณ Atbash กลับตัวอักษรฮีบรู ตอนนี้มันกลับตัวอักษรของเรา

\`\`\`
uozt{u54v3uuz076z3300937294104u698y50}
\`\`\``,
    category: "CRYPTO", difficulty: "Easy", base_points: 100,
    flag: "flag{f54e3ffa076a3300937294104f698b50}",
    hints: [{"text_en": "A→Z, B→Y, C→X ...", "text_th": "A↔Z, B↔Y, C↔X ...", "penalty_pct": 0}, {"text_en": "python: chr(ord('z')-(ord(c)-ord('a'))) for lowercase", "text_th": "python: chr(ord('z')-(ord(c)-ord('a'))) สำหรับตัวเล็ก", "penalty_pct": 25}],
    solution_th: "atbash('uozt{u54v3uuz076z3300937294104u698y50}')",
    visible: true,
  },
  {
    title_en: "Lucky Seven", title_th: "\u0e40\u0e25\u0e02 7 \u0e21\u0e07\u0e04\u0e25",
    description_en: `Caesar shifted by lucky number 7. Shift back to reveal the message.

\`\`\`
mshn{kkkj91407601h187hj40637h324j3h35}
\`\`\``,
    description_th: `Caesar เลื่อน 7 ตำแหน่ง ถอดรหัสกลับเพื่อพบข้อความ

\`\`\`
mshn{kkkj91407601h187hj40637h324j3h35}
\`\`\``,
    category: "CRYPTO", difficulty: "Easy", base_points: 100,
    flag: "flag{dddc91407601a187ac40637a324c3a35}",
    hints: [{"text_en": "Caesar cipher shifts each letter by a fixed amount", "text_th": "Caesar cipher เลื่อนตัวอักษรแต่ละตัวด้วยค่าคงที่", "penalty_pct": 0}, {"text_en": "Try shifting back 7 positions (or shift forward 19)", "text_th": "ลองเลื่อนกลับ 7 ตำแหน่ง (หรือเดินหน้า 19)", "penalty_pct": 25}, {"text_en": "python: chr((ord(c)-97-7)%26+97) for lowercase letters", "text_th": "python: chr((ord(c)-97-7)%26+97) สำหรับตัวเล็ก", "penalty_pct": 50}],
    solution_th: "caesar('mshn{kkkj91407601h187hj40637h324j3h35}', -7)",
    visible: true,
  },
  {
    title_en: "ROT-47", title_th: "\u0e2b\u0e21\u0e38\u0e19 47 \u0e2d\u0e07\u0e28\u0e32",
    description_en: `ROT13 was not enough. This message used ROT-47 which rotates all printable ASCII.

\`\`\`
7=28Lf_ch\`dd3\`7c74b_h2d56f6bdd7ge77_6N
\`\`\``,
    description_th: `ROT13 ไม่พอ ข้อความนี้ใช้ ROT-47 ซึ่งหมุน ASCII ที่พิมพ์ได้ทั้งหมด

\`\`\`
7=28Lf_ch\`dd3\`7c74b_h2d56f6bdd7ge77_6N
\`\`\``,
    category: "CRYPTO", difficulty: "Easy", base_points: 100,
    flag: "flag{7049155b1f4fc309a5de7e355f86ff0e}",
    hints: [{"text_en": "ROT-47 rotates ASCII chars from 33 (!) to 126 (~)", "text_th": "ROT-47 หมุนตัวอักษร ASCII ตั้งแต่ 33 (!) ถึง 126 (~)", "penalty_pct": 0}, {"text_en": "chr((ord(c)-33+47)%94+33) for printable ASCII", "text_th": "chr((ord(c)-33+47)%94+33) สำหรับ ASCII ที่พิมพ์ได้", "penalty_pct": 25}, {"text_en": "CyberChef → ROT47", "text_th": "CyberChef → ROT47", "penalty_pct": 50}],
    solution_th: "''.join(chr((ord(c)-33+47)%94+33) if 33<=ord(c)<=126 else c for c in '7=28Lf_ch`dd3`7c74b_h2d56f6bdd7ge77_6N')",
    visible: true,
  },
  {
    title_en: "Vigenere's Veil", title_th: "\u0e21\u0e48\u0e32\u0e19\u0e02\u0e2d\u0e07 Vigenere",
    description_en: `Blaise de Vigenère created a polyalphabetic cipher. The key is the name of our school's district.

\`\`\`
hcmy{g99up0x4e80609880565916v4809742n}
\`\`\``,
    description_th: `Vigenère สร้างรหัสลับแบบ polyalphabetic key คือชื่อย่อของโรงเรียนเรา

\`\`\`
hcmy{g99up0x4e80609880565916v4809742n}
\`\`\``,
    category: "CRYPTO", difficulty: "Medium", base_points: 300,
    flag: "flag{e99dd0f4c80609880565916e4809742b}",
    hints: [{"text_en": "Vigenere uses a keyword to shift different letters by different amounts", "text_th": "Vigenere ใช้คำกุญแจเพื่อเลื่อนแต่ละตัวอักษรด้วยจำนวนต่างกัน", "penalty_pct": 0}, {"text_en": "The key is 4 letters, related to our school", "text_th": "key มี 4 ตัวอักษร เกี่ยวข้องกับโรงเรียนเรา", "penalty_pct": 25}, {"text_en": "Key = CRMS", "text_th": "Key = CRMS", "penalty_pct": 50}],
    solution_th: "vigenere_dec('hcmy{g99up0x4e80609880565916v4809742n}', 'CRMS')",
    visible: true,
  },
  {
    title_en: "Rail Fence", title_th: "\u0e23\u0e31\u0e49\u0e27\u0e23\u0e32\u0e07\u0e23\u0e16\u0e44\u0e1f",
    description_en: `The message was written on a zigzag pattern across 3 rails.

\`\`\`
f{66e8f918lg9a1678433449a312}a78bdbf2f
\`\`\``,
    description_th: `ข้อความถูกเขียนในรูปแบบ zigzag บน 3 ราง

\`\`\`
f{66e8f918lg9a1678433449a312}a78bdbf2f
\`\`\``,
    category: "CRYPTO", difficulty: "Medium", base_points: 300,
    flag: "flag{97a618667b8e4d383b4f4f99a2311f28}",
    hints: [{"text_en": "Rail fence writes across diagonal rails like a fence", "text_th": "Rail fence เขียนข้ามรางแนวทแยงเหมือนรั้ว", "penalty_pct": 0}, {"text_en": "Try 3 rails — reorder by reading each rail top to bottom", "text_th": "ลอง 3 ราง — เรียงใหม่โดยอ่านแต่ละรางจากบนลงล่าง", "penalty_pct": 25}, {"text_en": "Use CyberChef → Rail Fence Cipher → rails=3", "text_th": "ใช้ CyberChef → Rail Fence Cipher → rails=3", "penalty_pct": 50}],
    solution_th: "rail_fence_dec('f{66e8f918lg9a1678433449a312}a78bdbf2f', 3)",
    visible: true,
  },
  {
    title_en: "Binary Storm", title_th: "\u0e1e\u0e32\u0e22\u0e38\u0e44\u0e1a\u0e19\u0e32\u0e23\u0e35",
    description_en: `XOR encryption with a single-byte key. Brute force or analyze the pattern.

\`\`\`
515b56504c03065651010e510e56555455530556060e0f0201040e0f56510e5451515554074a
\`\`\``,
    description_th: `เข้ารหัส XOR ด้วย key ขนาด 1 byte ลอง brute force หรือวิเคราะห์ pattern

\`\`\`
515b56504c03065651010e510e56555455530556060e0f0201040e0f56510e5451515554074a
\`\`\``,
    category: "CRYPTO", difficulty: "Medium", base_points: 300,
    flag: "flag{41af69f9abcbd2a19856398af9cffbc0}",
    hints: [{"text_en": "XOR brute force: try all 256 possible single-byte keys", "text_th": "XOR brute force: ลองทุก key ขนาด 1 byte (0x00-0xFF)", "penalty_pct": 0}, {"text_en": "If you know the plaintext starts with 'flag{', XOR 'f' (0x66) with first byte to find key", "text_th": "ถ้าทราบว่าขึ้นต้นด้วย 'flag{' XOR 'f' (0x66) กับ byte แรกเพื่อหา key", "penalty_pct": 25}, {"text_en": "Key is 0x37", "text_th": "Key คือ 0x37", "penalty_pct": 50}],
    solution_th: "bytes(b^0x37 for b in bytes.fromhex('515b56504c03065651010e510e56555455530556060e0f0201040e0f56510e5451515554074a')).decode()",
    visible: true,
  },
  {
    title_en: "Base58 Beach", title_th: "\u0e0a\u0e32\u0e22\u0e2b\u0e32\u0e14 Base58",
    description_en: `Bitcoin's favorite encoding. No 0, O, I, or l to avoid confusion.

\`\`\`
G9mzcaHs2njw2VGyu9tjm34piUbJm2FkH1h6EpbiFskZfYoHhLmS
\`\`\``,
    description_th: `encoding ที่ Bitcoin ชอบใช้ ไม่มี 0, O, I, หรือ l เพื่อหลีกเลี่ยงความสับสน

\`\`\`
G9mzcaHs2njw2VGyu9tjm34piUbJm2FkH1h6EpbiFskZfYoHhLmS
\`\`\``,
    category: "CRYPTO", difficulty: "Medium", base_points: 300,
    flag: "flag{cf51fc6baab02e863c4142d21c295f1d}",
    hints: [{"text_en": "Base58 = Base64 minus confusing characters (0 O I l + /)", "text_th": "Base58 = Base64 ลบตัวอักษรที่สับสน (0 O I l + /)", "penalty_pct": 0}, {"text_en": "Use CyberChef → From Base58", "text_th": "ใช้ CyberChef → From Base58", "penalty_pct": 25}],
    solution_th: "base58.b58decode('G9mzcaHs2njw2VGyu9tjm34piUbJm2FkH1h6EpbiFskZfYoHhLmS')",
    visible: true,
  },
  {
    title_en: "Affine Transformation", title_th: "\u0e01\u0e32\u0e23\u0e41\u0e1b\u0e25\u0e07 Affine",
    description_en: `A linear transformation over the alphabet: E(x) = (ax+b) mod 26. Parameters hidden in the challenge name.

\`\`\`
hlim{43130ixs0c374948776c3c1109478n00}
\`\`\``,
    description_th: `การแปลงเชิงเส้นบนตัวอักษร: E(x) = (ax+b) mod 26 พารามิเตอร์ซ่อนอยู่ในชื่อโจทย์

\`\`\`
hlim{43130ixs0c374948776c3c1109478n00}
\`\`\``,
    category: "CRYPTO", difficulty: "Hard", base_points: 500,
    flag: "flag{43130adc0e374948776e3e1109478b00}",
    hints: [{"text_en": "Affine cipher: E(x) = (a*x + b) mod 26", "text_th": "Affine cipher: E(x) = (a*x + b) mod 26", "penalty_pct": 0}, {"text_en": "Decrypt: D(y) = a_inv * (y - b) mod 26", "text_th": "ถอดรหัส: D(y) = a_inv * (y - b) mod 26", "penalty_pct": 25}, {"text_en": "a=5, b=8 (5 letters in 'Affine', 8 hours of sleep)", "text_th": "a=5, b=8", "penalty_pct": 50}],
    solution_th: "affine_dec('hlim{43130ixs0c374948776c3c1109478n00}', 5, 8)",
    visible: true,
  },
  {
    title_en: "Polybius Square", title_th: "\u0e08\u0e31\u0e15\u0e38\u0e23\u0e31\u0e2a Polybius",
    description_en: `Ancient Greek cipher — each letter becomes a coordinate pair on a 5x5 grid.

\`\`\`
21 31 11 22 { 3 0 5 5 8 15 14 5 0 12 21 0 6 6 15 6 6 15 1 7 5 2 3 6 3 14 13 13 21 3 12 1 }
\`\`\``,
    description_th: `รหัสกรีกโบราณ — แต่ละตัวอักษรกลายเป็นคู่พิกัดบน grid 5x5

\`\`\`
21 31 11 22 { 3 0 5 5 8 15 14 5 0 12 21 0 6 6 15 6 6 15 1 7 5 2 3 6 3 14 13 13 21 3 12 1 }
\`\`\``,
    category: "CRYPTO", difficulty: "Medium", base_points: 300,
    flag: "flag{30558ed50bf066e66e1752363dccf3b1}",
    hints: [{"text_en": "5x5 grid: row and column numbers", "text_th": "Grid 5x5: ตัวเลข row และ column", "penalty_pct": 0}, {"text_en": "ABCDE / FGHIK / LMNOP / QRSTU / VWXYZ (I=J)", "text_th": "ABCDE / FGHIK / LMNOP / QRSTU / VWXYZ (I=J)", "penalty_pct": 25}, {"text_en": "11=A, 12=B, 21=F, 22=G...", "text_th": "11=A, 12=B, 21=F, 22=G...", "penalty_pct": 50}],
    solution_th: "polybius_dec('21 31 11 22 { 3 0 5 5 8 15 14 5 0 12 21 0 6 6 15 6 6 15 1 7 5 2 3 6 3 14 13 13 21 3 12 1 }')",
    visible: true,
  },
  {
    title_en: "Double Dip", title_th: "\u0e08\u0e38\u0e48\u0e21\u0e2a\u0e2d\u0e07",
    description_en: `Déjà vu. Decode twice.

\`\`\`
Wm14aFozdGhPRFEzWXpJMU1UUXpZMk16T1RRME16a3lZV1JoTldKalkyUXdOMkUxTlgwPQ==
\`\`\``,
    description_th: `เดจาวู Decode สองครั้ง

\`\`\`
Wm14aFozdGhPRFEzWXpJMU1UUXpZMk16T1RRME16a3lZV1JoTldKalkyUXdOMkUxTlgwPQ==
\`\`\``,
    category: "CRYPTO", difficulty: "Easy", base_points: 100,
    flag: "flag{a847c25143cc3944392ada5bccd07a55}",
    hints: [{"text_en": "Looks like Base64 (ends with =)", "text_th": "ดูเหมือน Base64 (ลงท้าย =)", "penalty_pct": 0}, {"text_en": "After one decode it still looks like Base64", "text_th": "Decode หนึ่งรอบแล้วยังเหมือน Base64 อยู่", "penalty_pct": 25}],
    solution_th: "base64.b64decode(base64.b64decode('Wm14aFozdGhPRFEzWXpJMU1UUXpZMk16T1RRME16a3lZV1JoTldKalkyUXdOMkUxTlgwPQ==')).decode()",
    visible: true,
  },
  {
    title_en: "Column Commander", title_th: "\u0e1c\u0e39\u0e49\u0e1a\u0e31\u0e0d\u0e0a\u0e32\u0e01\u0e32\u0e23\u0e04\u0e2d\u0e25\u0e31\u0e21\u0e19\u0e4c",
    description_en: `A columnar transposition cipher. The key is our school code.

\`\`\`
{3e2a35-f0e42a83a0c3fd9}l9ca4415g4cb6fd-
\`\`\``,
    description_th: `Columnar transposition cipher โดยใช้รหัสโรงเรียนเป็น key

\`\`\`
{3e2a35-f0e42a83a0c3fd9}l9ca4415g4cb6fd-
\`\`\``,
    category: "CRYPTO", difficulty: "Hard", base_points: 500,
    flag: "flag{09043eccce4a3b224f6aa4df3819d535}",
    hints: [{"text_en": "Columnar transposition rearranges characters by column", "text_th": "Columnar transposition จัดเรียงตัวอักษรใหม่ตามคอลัมน์", "penalty_pct": 0}, {"text_en": "The key determines the column order — key is related to school", "text_th": "key กำหนดลำดับคอลัมน์ — key เกี่ยวกับโรงเรียน", "penalty_pct": 25}, {"text_en": "Key = CRMS6", "text_th": "Key = CRMS6", "penalty_pct": 50}],
    solution_th: "columnar_dec('{3e2a35-f0e42a83a0c3fd9}l9ca4415g4cb6fd-', 'CRMS6')",
    visible: true,
  },
  {
    title_en: "Morse Reloaded", title_th: "\u0e21\u0e2d\u0e23\u0e4c\u0e2a\u0e23\u0e35\u0e42\u0e2b\u0e25\u0e14",
    description_en: `Decode the Morse code between the markers. Wrap in flag{...}

START → ..-. . ---.. ..... -.. .- ..--- ----. --... -.-. ...-- ----. ....- -... ----. ..... ---.. -.-. ---.. ----- ....- ----- ..-. .- . . -.-. -... ----. ..-. ----. ..... ← END`,
    description_th: `ถอดรหัส Morse code ระหว่าง marker แล้วใส่ใน flag{...}

START → ..-. . ---.. ..... -.. .- ..--- ----. --... -.-. ...-- ----. ....- -... ----. ..... ---.. -.-. ---.. ----- ....- ----- ..-. .- . . -.-. -... ----. ..-. ----. ..... ← END`,
    category: "CRYPTO", difficulty: "Easy", base_points: 100,
    flag: "flag{fe85da297c394b958c8040faeecb9f95}",
    hints: [{"text_en": "Use dcode.fr/morse-code", "text_th": "ใช้ dcode.fr/morse-code", "penalty_pct": 0}, {"text_en": ". = dit, - = dah, space = letter boundary", "text_th": ". = dit, - = dah, space = คั่นตัวอักษร", "penalty_pct": 25}],
    solution_th: "morse_dec('..-. . ---.. ..... -.. .- ..--- ----. --... -.-. ...-- ----. ....- -... ----. ..... ---.. -.-. ---.. ----- ....- ----- ..-. .- . . -.-. -... ----. ..-. ----. .....') \u2192 wrap in flag{...}",
    visible: true,
  },
  {
    title_en: "Mystery Shift", title_th: "\u0e01\u0e32\u0e23\u0e40\u0e25\u0e37\u0e48\u0e2d\u0e19\u0e25\u0e36\u0e01\u0e25\u0e31\u0e1a",
    description_en: `ROT13? No. The shift is somewhere between 1-25. Brute force it.

\`\`\`
yetz{58vux309y065786219054345wx3853wx}
\`\`\``,
    description_th: `ROT13? ไม่ใช่ การเลื่อนอยู่ที่ไหนสักแห่งระหว่าง 1-25 ลอง brute force

\`\`\`
yetz{58vux309y065786219054345wx3853wx}
\`\`\``,
    category: "CRYPTO", difficulty: "Easy", base_points: 100,
    flag: "flag{58cbe309f065786219054345de3853de}",
    hints: [{"text_en": "Try all 25 possible Caesar shifts", "text_th": "ลองทั้ง 25 การเลื่อน Caesar ที่เป็นไปได้", "penalty_pct": 0}, {"text_en": "Look for the shift that gives 'flag{' in the result", "text_th": "หาการเลื่อนที่ทำให้ได้ 'flag{' ในผลลัพธ์", "penalty_pct": 25}],
    solution_th: "caesar('yetz{58vux309y065786219054345wx3853wx}', -19)",
    visible: true,
  },
  {
    title_en: "Hex64", title_th: "\u0e40\u0e2e\u0e47\u0e01\u0e0b\u0e4c\u0e2b\u0e01\u0e2a\u0e34\u0e1a\u0e2a\u0e35\u0e48",
    description_en: `Base64 of hex. Two encoding layers, both reversible.

\`\`\`
NjY2YzYxNjc3YjM5NjQ2NTY1NjMzOTY1NjMzMzMxMzM2NTMyMzUzOTM1NjYzNjY1MzA2NDM1NjEzMzM2MzczMzM2MzA2NDM3MzY3ZA==
\`\`\``,
    description_th: `Base64 ของ hex สองชั้น encoding ทั้งคู่ถอดกลับได้

\`\`\`
NjY2YzYxNjc3YjM5NjQ2NTY1NjMzOTY1NjMzMzMxMzM2NTMyMzUzOTM1NjYzNjY1MzA2NDM1NjEzMzM2MzczMzM2MzA2NDM3MzY3ZA==
\`\`\``,
    category: "CRYPTO", difficulty: "Medium", base_points: 300,
    flag: "flag{9deec9ec313e2595f6e0d5a367360d76}",
    hints: [{"text_en": "Ends with = — start with Base64", "text_th": "ลงท้าย = เริ่มต้นด้วย Base64", "penalty_pct": 0}, {"text_en": "After Base64 decode you'll see a hex string", "text_th": "หลัง Base64 decode จะเห็น hex string", "penalty_pct": 25}],
    solution_th: "bytes.fromhex(base64.b64decode('NjY2YzYxNjc3YjM5NjQ2NTY1NjMzOTY1NjMzMzMxMzM2NTMyMzUzOTM1NjYzNjY1MzA2NDM1NjEzMzM2MzczMzM2MzA2NDM3MzY3ZA==').decode()).decode()",
    visible: true,
  },
  {
    title_en: "T9 Texting", title_th: "\u0e1e\u0e34\u0e21\u0e1e\u0e4c T9",
    description_en: `Old phone keypads encoded text as number sequences. Decode the T9 message.

\`\`\`
333 555 2 4 { 2 1 6 0 7 1 6 222 5 3 2 3 8 2 8 4 222 1 0 8 222 33 3 7 2 4 3 8 2 33 2 3 }
\`\`\``,
    description_th: `โทรศัพท์รุ่นเก่าเข้ารหัสข้อความเป็นลำดับตัวเลข ถอดรหัส T9 message นี้

\`\`\`
333 555 2 4 { 2 1 6 0 7 1 6 222 5 3 2 3 8 2 8 4 222 1 0 8 222 33 3 7 2 4 3 8 2 33 2 3 }
\`\`\``,
    category: "MISC", difficulty: "Easy", base_points: 100,
    flag: "flag{2160716c5d2d8284c108ced7a4d8aea3}",
    hints: [{"text_en": "2=abc, 22=b, 222=c, 3=def, 4=ghi, 5=jkl, 6=mno, 7=pqrs, 8=tuv, 9=wxyz", "text_th": "2=abc, 22=b, 222=c, 3=def, ...", "penalty_pct": 0}, {"text_en": "Use an online T9 decoder", "text_th": "ใช้ T9 decoder ออนไลน์", "penalty_pct": 25}],
    solution_th: "T9 decode",
    visible: true,
  },
  {
    title_en: "NATO Phonetic", title_th: "\u0e19\u0e32\u0e42\u0e15\u0e49\u0e42\u0e1f\u0e40\u0e19\u0e15\u0e34\u0e01",
    description_en: `Alpha Bravo Charlie... take only the first letter of each word.

\`\`\`
Foxtrot-Lima-Alpha-Golf-LBRACE-Five-Zero-Three-Eight-Two-Eight-Alpha-Zero-Nine-Zero-Seven-One-Foxtrot-Six-Seven-Six-Three-Echo-One-Echo-Seven-Delta-Echo-Bravo-Two-One-Four-Zero-Delta-Delta-Nine-Six-RBRACE
\`\`\``,
    description_th: `Alpha Bravo Charlie... นำตัวอักษรแรกของแต่ละคำมา

\`\`\`
Foxtrot-Lima-Alpha-Golf-LBRACE-Five-Zero-Three-Eight-Two-Eight-Alpha-Zero-Nine-Zero-Seven-One-Foxtrot-Six-Seven-Six-Three-Echo-One-Echo-Seven-Delta-Echo-Bravo-Two-One-Four-Zero-Delta-Delta-Nine-Six-RBRACE
\`\`\``,
    category: "MISC", difficulty: "Easy", base_points: 100,
    flag: "flag{503828a09071f6763e1e7deb2140dd96}",
    hints: [{"text_en": "NATO phonetic alphabet: Alpha=A, Bravo=B, Charlie=C...", "text_th": "NATO: Alpha=A, Bravo=B, Charlie=C...", "penalty_pct": 0}, {"text_en": "Take the first letter of each NATO word", "text_th": "นำตัวอักษรแรกของแต่ละคำ NATO", "penalty_pct": 25}],
    solution_th: "Take first letter of each NATO word",
    visible: true,
  },
  {
    title_en: "Dot Patterns", title_th: "\u0e25\u0e27\u0e14\u0e25\u0e32\u0e22\u0e08\u0e38\u0e14",
    description_en: `Each group of 8 dots (0=empty, 1=dot) forms a character.

\`\`\`
01100110 01101100 01100001 01100111 01111011 01100010 00110011 01100011 00110100...
\`\`\`

Full: \`01100110 01101100 01100001 01100111 01111011 01100010 00110011 01100011 00110100 00110010 00110000 00110011 01100011 01100010 00110111 00111000 00111000 00110000 00110101 01100001 01100001 00110111 00110000 01100100 01100010 00111001 00110001 01100001 00111000 00110111 00110000 01100100 00110110 00110110 00110000 01100101 00110011 01111101\``,
    description_th: `แต่ละกลุ่ม 8 ตัว (0=ว่าง, 1=จุด) คือตัวอักษรหนึ่งตัว

Full: \`01100110 01101100 01100001 01100111 01111011 01100010 00110011 01100011 00110100 00110010 00110000 00110011 01100011 01100010 00110111 00111000 00111000 00110000 00110101 01100001 01100001 00110111 00110000 01100100 01100010 00111001 00110001 01100001 00111000 00110111 00110000 01100100 00110110 00110110 00110000 01100101 00110011 01111101\``,
    category: "MISC", difficulty: "Easy", base_points: 100,
    flag: "flag{b3c4203cb78805aa70db91a870d660e3}",
    hints: [{"text_en": "8-bit binary to ASCII", "text_th": "ไบนารี 8 บิตเป็น ASCII", "penalty_pct": 0}, {"text_en": "python: chr(int('01100110',2)) = 'f'", "text_th": "python: chr(int('01100110',2)) = 'f'", "penalty_pct": 25}],
    solution_th: "''.join(chr(int(b,2)) for b in s.split())",
    visible: true,
  },
  {
    title_en: "Pig Latin", title_th: "\u0e20\u0e32\u0e29\u0e32\u0e2b\u0e21\u0e39",
    description_en: `Oday ouyay eakspay igpay atinlay?

\`\`\`
ag{e74636ef8e36c19aa0a8bd52306a1eb0}flay
\`\`\``,
    description_th: `คุณพูด Pig Latin ได้ไหม?

\`\`\`
ag{e74636ef8e36c19aa0a8bd52306a1eb0}flay
\`\`\``,
    category: "MISC", difficulty: "Easy", base_points: 100,
    flag: "flag{e74636ef8e36c19aa0a8bd52306a1eb0}",
    hints: [{"text_en": "Pig Latin: move consonants to end + add 'ay'", "text_th": "Pig Latin: ย้ายพยัญชนะต้นไปท้าย + เติม 'ay'", "penalty_pct": 0}, {"text_en": "If word starts with vowel, add 'way' at the end", "text_th": "ถ้าคำขึ้นต้นสระ เติม 'way' ที่ท้าย", "penalty_pct": 25}],
    solution_th: "reverse pig latin transform",
    visible: true,
  },
  {
    title_en: "Tap Code", title_th: "\u0e23\u0e2b\u0e31\u0e2a\u0e40\u0e04\u0e32\u0e30",
    description_en: `Prisoners communicated through walls by tapping. Row then column on a 5x5 grid.

\`\`\`
21 31 11 22 { 7 13 15 3 12 8 6 15 2 21 5 2 7 21 14 1 2 14 3 0 6 13 21 8 21 6 0 11 4 3 13 0 }
\`\`\``,
    description_th: `นักโทษสื่อสารผ่านกำแพงด้วยการเคาะ แถวแล้วคอลัมน์บน grid 5x5

\`\`\`
21 31 11 22 { 7 13 15 3 12 8 6 15 2 21 5 2 7 21 14 1 2 14 3 0 6 13 21 8 21 6 0 11 4 3 13 0 }
\`\`\``,
    category: "MISC", difficulty: "Medium", base_points: 300,
    flag: "flag{7ce3b86e2f527fd12d306cf8f60a43c0}",
    hints: [{"text_en": "5x5 grid, K=C (row 2 col 5 = 25 = K/C)", "text_th": "Grid 5x5, K=C (แถว 2 คอลัมน์ 5 = 25 = K/C)", "penalty_pct": 0}, {"text_en": "11=A, 12=B, 13=C, 21=F...", "text_th": "11=A, 12=B, 13=C, 21=F...", "penalty_pct": 25}],
    solution_th: "tap code decode",
    visible: true,
  },
  {
    title_en: "1337 5p34k", title_th: "\u0e20\u0e32\u0e29\u0e32\u0e25\u0e35\u0e17",
    description_en: `H4x0r5 r3pl4c3 l3tt3r5 w1th numb3r5. D3c0d3 th15.

\`\`\`
f149{81499397d861f88308c55d431c31db33}
\`\`\``,
    description_th: `H4x0r5 แทนตัวอักษรด้วยตัวเลข ถอดรหัสสิ่งนี้

\`\`\`
f149{81499397d861f88308c55d431c31db33}
\`\`\``,
    category: "MISC", difficulty: "Easy", base_points: 100,
    flag: "flag{81a99397d861f88e08c55d431c31db3e}",
    hints: [{"text_en": "Leet: 4=a, 3=e, 1=i/l, 0=o, 5=s, 7=t, 9=g", "text_th": "Leet: 4=a, 3=e, 1=i/l, 0=o, 5=s, 7=t, 9=g", "penalty_pct": 0}],
    solution_th: "replace leet chars back to letters",
    visible: true,
  },
  {
    title_en: "Color Code", title_th: "\u0e23\u0e2b\u0e31\u0e2a\u0e2a\u0e35",
    description_en: `A painter hid a message in grayscale colors. Each RGB value is the same for R, G, and B.

\`rgb(102,102,102) rgb(108,108,108) rgb(97,97,97) rgb(103,103,103) rgb(123,123,123) rgb(51,51,51) rgb(...\`

Full data:
\`\`\`
rgb(102,102,102) rgb(108,108,108) rgb(97,97,97) rgb(103,103,103) rgb(123,123,123) rgb(51,51,51) rgb(51,51,51) rgb(53,53,53) rgb(100,100,100) rgb(51,51,51) rgb(102,102,102) rgb(102,102,102) rgb(102,102,102) rgb(97,97,97) rgb(52,52,52) rgb(52,52,52) rgb(101,101,101) rgb(98,98,98) rgb(54,54,54) rgb(100,100,100) rgb(56,56,56) rgb(48,48,48) rgb(100,100,100) rgb(50,50,50) rgb(97,97,97) rgb(99,99,99) rgb(99,99,99) rgb(54,54,54) rgb(56,56,56) rgb(53,53,53) rgb(102,102,102) rgb(53,53,53) rgb(52,52,52) rgb(101,101,101) rgb(48,48,48) rgb(57,57,57) rgb(98,98,98) rgb(125,125,125)
\`\`\``,
    description_th: `จิตรกรซ่อนข้อความในสี grayscale ค่า RGB แต่ละชุด R=G=B

\`\`\`
rgb(102,102,102) rgb(108,108,108) rgb(97,97,97) rgb(103,103,103) rgb(123,123,123) rgb(51,51,51) rgb(51,51,51) rgb(53,53,53) rgb(100,100,100) rgb(51,51,51) rgb(102,102,102) rgb(102,102,102) rgb(102,102,102) rgb(97,97,97) rgb(52,52,52) rgb(52,52,52) rgb(101,101,101) rgb(98,98,98) rgb(54,54,54) rgb(100,100,100) rgb(56,56,56) rgb(48,48,48) rgb(100,100,100) rgb(50,50,50) rgb(97,97,97) rgb(99,99,99) rgb(99,99,99) rgb(54,54,54) rgb(56,56,56) rgb(53,53,53) rgb(102,102,102) rgb(53,53,53) rgb(52,52,52) rgb(101,101,101) rgb(48,48,48) rgb(57,57,57) rgb(98,98,98) rgb(125,125,125)
\`\`\``,
    category: "MISC", difficulty: "Medium", base_points: 300,
    flag: "flag{335d3fffa44eb6d80d2acc685f54e09b}",
    hints: [{"text_en": "When R=G=B, the color is grayscale. Each value is an ASCII code.", "text_th": "เมื่อ R=G=B สีเป็น grayscale แต่ละค่าคือ ASCII code", "penalty_pct": 0}, {"text_en": "Extract just the R (or G or B) value from each color", "text_th": "ดึงค่า R (หรือ G หรือ B) จากแต่ละสี", "penalty_pct": 25}],
    solution_th: "re.findall(r'rgb\\((\\d+),', s) \u2192 chr each",
    visible: true,
  },
  {
    title_en: "Cipher Stew", title_th: "\u0e2a\u0e15\u0e39\u0e27\u0e4c\u0e23\u0e2b\u0e31\u0e2a",
    description_en: `A mysterious mix of two classic techniques.

\`\`\`
MzkuM3guAmL5ZwOwBJAyAmVlBQN1LzL2BQyyZmt5MQyyMQSzMU0=
\`\`\``,
    description_th: `ส่วนผสมลึกลับของสองเทคนิคคลาสสิก

\`\`\`
MzkuM3guAmL5ZwOwBJAyAmVlBQN1LzL2BQyyZmt5MQyyMQSzMU0=
\`\`\``,
    category: "MISC", difficulty: "Medium", base_points: 300,
    flag: "flag{a76920c9ce722805bf689e389d9ed1fd}",
    hints: [{"text_en": "Something seems off about this Base64...", "text_th": "Base64 นี้ดูผิดปกติบางอย่าง...", "penalty_pct": 0}, {"text_en": "ROT13 it first, THEN decode Base64", "text_th": "ROT13 ก่อน แล้วค่อย decode Base64", "penalty_pct": 25}],
    solution_th: "base64.b64decode(codecs.decode('MzkuM3guAmL5ZwOwBJAyAmVlBQN1LzL2BQyyZmt5MQyyMQSzMU0=','rot_13')).decode()",
    visible: true,
  },
  {
    title_en: "Strings Hunter", title_th: "\u0e19\u0e31\u0e01\u0e25\u0e48\u0e32 Strings",
    description_en: `This hex dump contains a binary file. Find the readable string inside.

\`\`\`
390c8c7d7247342cd8100f2f6f770d65d670e58e0351d8ae8e4f6eac342fc231b7b08716eb3fc12896b96223177494287733666c61677b33633731356535306262346235643332653162663332303030383232663236667dc28ee8ba53bdb56b8824577d53ecc28a70a61c7510a1cd89216ca16cffcaea4987477e86dbccb97046fc2e18384e51d820c5
\`\`\`

*Tip: convert hex to bytes, look for printable ASCII sequences*`,
    description_th: `Hex dump นี้มีไฟล์ binary อยู่ หาข้อความที่อ่านได้ข้างใน

\`\`\`
390c8c7d7247342cd8100f2f6f770d65d670e58e0351d8ae8e4f6eac342fc231b7b08716eb3fc12896b96223177494287733666c61677b33633731356535306262346235643332653162663332303030383232663236667dc28ee8ba53bdb56b8824577d53ecc28a70a61c7510a1cd89216ca16cffcaea4987477e86dbccb97046fc2e18384e51d820c5
\`\`\``,
    category: "FOR", difficulty: "Easy", base_points: 100,
    flag: "flag{3c715e50bb4b5d32e1bf32000822f26f}",
    hints: [{"text_en": "Convert hex to bytes, then look for printable characters", "text_th": "แปลง hex เป็น bytes แล้วหาตัวอักษรที่พิมพ์ได้", "penalty_pct": 0}, {"text_en": "python: bytes.fromhex(hex_str) then filter printable chars", "text_th": "python: bytes.fromhex(hex_str) แล้วกรองตัวอักษรที่พิมพ์ได้", "penalty_pct": 25}, {"text_en": "Use re.findall(rb'flag\\{[^}]+\\}', data)", "text_th": "ใช้ re.findall(rb'flag\\{[^}]+\\}', data)", "penalty_pct": 50}],
    solution_th: "re.findall(rb'flag{.*?}', bytes.fromhex(hex_str))",
    visible: true,
  },
  {
    title_en: "Magic Bytes", title_th: "Magic Bytes",
    description_en: `Every file format has a unique signature at the start — called magic bytes.

You found 3 mystery files. Match each to its format:

\`\`\`
File A: 89504e470d0a1a0a...
File B: 504b0304...
File C: 255044462d...
\`\`\`

The flag is hidden in the ZIP file. It starts with \`PK\`.
XOR the ZIP magic bytes \`504b0304\` with the PNG magic bytes \`89504e47\` byte by byte.
Convert the result to decimal — that's the flag.

\`flag{\` + hex(504b0304 XOR 89504e47) as decimal + \`}\`

Actual flag: \`flag{c67f6f6cc240c91b62ac81fd89de4ed0}\``,
    description_th: `ทุกไฟล์มี signature พิเศษที่ต้นไฟล์ เรียกว่า magic bytes

คุณพบไฟล์ลึกลับ 3 ไฟล์ match แต่ละไฟล์กับ format:
\`\`\`
A: 89504e470d0a1a0a...
B: 504b0304...
C: 255044462d...
\`\`\`
flag คือ \`flag{c67f6f6cc240c91b62ac81fd89de4ed0}\``,
    category: "FOR", difficulty: "Easy", base_points: 100,
    flag: "flag{c67f6f6cc240c91b62ac81fd89de4ed0}",
    hints: [{"text_en": "PNG starts with 89 50 4E 47, ZIP starts with 50 4B 03 04, PDF starts with 25 50 44 46", "text_th": "PNG เริ่มด้วย 89 50 4E 47, ZIP เริ่มด้วย 50 4B 03 04, PDF เริ่มด้วย 25 50 44 46", "penalty_pct": 0}, {"text_en": "File A=PNG, File B=ZIP, File C=PDF", "text_th": "File A=PNG, File B=ZIP, File C=PDF", "penalty_pct": 25}],
    solution_th: "identify magic bytes",
    visible: true,
  },
  {
    title_en: "Encoded Attachment", title_th: "\u0e44\u0e1f\u0e25\u0e4c\u0e41\u0e19\u0e1a\u0e17\u0e35\u0e48\u0e40\u0e02\u0e49\u0e32\u0e23\u0e2b\u0e31\u0e2a",
    description_en: `Someone sent this 'file' over email as a Base64 attachment. Decode it.

\`\`\`
IyBTZWNyZXQgTm90ZXMKRGF0ZTogMjAyNi0wMy0xMQpGbGFnOiBmbGFne2E1ZWY0NTAxYjRmNDFmZjkwZDQzZWE0MWQwMjI5ZDRifQpEbyBub3Qgc2hhcmUhCg==
\`\`\``,
    description_th: `มีคนส่ง 'ไฟล์' นี้ทางอีเมลในรูป Base64 ถอดรหัสมัน

\`\`\`
IyBTZWNyZXQgTm90ZXMKRGF0ZTogMjAyNi0wMy0xMQpGbGFnOiBmbGFne2E1ZWY0NTAxYjRmNDFmZjkwZDQzZWE0MWQwMjI5ZDRifQpEbyBub3Qgc2hhcmUhCg==
\`\`\``,
    category: "FOR", difficulty: "Easy", base_points: 100,
    flag: "flag{a5ef4501b4f41ff90d43ea41d0229d4b}",
    hints: [{"text_en": "Base64 attachments are common in emails", "text_th": "ไฟล์แนบ Base64 พบได้ทั่วไปในอีเมล", "penalty_pct": 0}, {"text_en": "python: base64.b64decode(s).decode() then read content", "text_th": "python: base64.b64decode(s).decode() แล้วอ่านเนื้อหา", "penalty_pct": 25}],
    solution_th: "base64.b64decode('IyBTZWNyZXQgTm90ZXMKRGF0ZTogMjAyNi0wMy0xMQpGbGFnOiBmbGFne2E1ZWY0NTAxYjRmNDFmZjkwZDQzZWE0MWQwMjI5ZDRifQpEbyBub3Qgc2hhcmUhCg==').decode()",
    visible: true,
  },
  {
    title_en: "Hex Dump Decoder", title_th: "\u0e16\u0e2d\u0e14 Hex Dump",
    description_en: `A text file was saved as a hex dump. Read between the lines.

\`\`\`
4c6f72656d20697073756d20646f6c6f722073697420616d65742c0a636f6e73656374657475722061646970697363696e6720656c69742e0a2320666c61677b36633130383930333232643135366566616164333466303063353739333631377d0a53656420646f20656975736d6f642074656d706f722e
\`\`\``,
    description_th: `ไฟล์ text ถูกบันทึกเป็น hex dump อ่านระหว่างบรรทัด

\`\`\`
4c6f72656d20697073756d20646f6c6f722073697420616d65742c0a636f6e73656374657475722061646970697363696e6720656c69742e0a2320666c61677b36633130383930333232643135366566616164333466303063353739333631377d0a53656420646f20656975736d6f642074656d706f722e
\`\`\``,
    category: "FOR", difficulty: "Easy", base_points: 100,
    flag: "flag{6c10890322d156efaad34f00c5793617}",
    hints: [{"text_en": "Convert hex to ASCII text", "text_th": "แปลง hex เป็น ASCII text", "penalty_pct": 0}, {"text_en": "python: bytes.fromhex(s).decode()", "text_th": "python: bytes.fromhex(s).decode()", "penalty_pct": 25}],
    solution_th: "bytes.fromhex(hex36).decode()",
    visible: true,
  },
  {
    title_en: "Compressed Evidence", title_th: "\u0e2b\u0e25\u0e31\u0e01\u0e10\u0e32\u0e19\u0e17\u0e35\u0e48\u0e1a\u0e35\u0e1a\u0e2d\u0e31\u0e14",
    description_en: `This evidence was compressed before transmission. Decompress to read it.

\`\`\`
eJxLy0lMr042STMyTDO2ME4yMTQ3NTBNSzY2M0wzT002MbdMNTdPqwUA4GILNA==
\`\`\``,
    description_th: `หลักฐานนี้ถูกบีบอัดก่อนส่ง ขยายเพื่ออ่าน

\`\`\`
eJxLy0lMr042STMyTDO2ME4yMTQ3NTBNSzY2M0wzT002MbdMNTdPqwUA4GILNA==
\`\`\``,
    category: "FOR", difficulty: "Medium", base_points: 300,
    flag: "flag{c4f21f383b417505fc361f7ec479e77f}",
    hints: [{"text_en": "Data is compressed AND encoded", "text_th": "ข้อมูลถูกบีบอัดและเข้ารหัส", "penalty_pct": 0}, {"text_en": "Try Base64 decode first, then decompress", "text_th": "ลอง Base64 decode ก่อน แล้วค่อย decompress", "penalty_pct": 25}, {"text_en": "python: zlib.decompress(base64.b64decode(s)).decode()", "text_th": "python: zlib.decompress(base64.b64decode(s)).decode()", "penalty_pct": 50}],
    solution_th: "zlib.decompress(base64.b64decode('eJxLy0lMr042STMyTDO2ME4yMTQ3NTBNSzY2M0wzT002MbdMNTdPqwUA4GILNA==')).decode()",
    visible: true,
  },
  {
    title_en: "Evidence Tampering", title_th: "\u0e01\u0e32\u0e23\u0e1b\u0e25\u0e2d\u0e21\u0e41\u0e1b\u0e25\u0e07\u0e2b\u0e25\u0e31\u0e01\u0e10\u0e32\u0e19",
    description_en: `Someone tried to hide their tracks by reversing the encoded data.

\`\`\`
=0XMycTMykjZ1IzM2AjMwcTN0YDM5IGMwAjMjRWM1YWMjt3ZhxmZ
\`\`\``,
    description_th: `มีคนพยายามซ่อนรอยเท้าโดยกลับ data ที่เข้ารหัสไว้

\`\`\`
=0XMycTMykjZ1IzM2AjMwcTN0YDM5IGMwAjMjRWM1YWMjt3ZhxmZ
\`\`\``,
    category: "FOR", difficulty: "Medium", base_points: 300,
    flag: "flag{c1f51dc2000b9064570206325f921721}",
    hints: [{"text_en": "It doesn't look like valid Base64 as-is", "text_th": "มันไม่ดูเหมือน Base64 ที่ถูกต้อง", "penalty_pct": 0}, {"text_en": "Try reversing the string first", "text_th": "ลองกลับ string ก่อน", "penalty_pct": 25}],
    solution_th: "base64.b64decode('=0XMycTMykjZ1IzM2AjMwcTN0YDM5IGMwAjMjRWM1YWMjt3ZhxmZ'[::-1]).decode()",
    visible: true,
  },
  {
    title_en: "Deep Dive", title_th: "\u0e14\u0e33\u0e14\u0e34\u0e48\u0e07",
    description_en: `Three layers of obfuscation. Peel each one carefully.

\`\`\`
Nzg5YzRiY2I0OTRjYWYzNjM3MzczNDM2NGY0ZTM2YjQ0YzMxMzczNDMxMzczMDM0NGUzNDM3NGY0OTMyMzQzMjRiMzM0YTM0MzEzNjM3YWQwNTAwZDY3ODBhOTE=
\`\`\``,
    description_th: `สามชั้นของการปกปิด ลอกทีละชั้น

\`\`\`
Nzg5YzRiY2I0OTRjYWYzNjM3MzczNDM2NGY0ZTM2YjQ0YzMxMzczNDMxMzczMDM0NGUzNDM3NGY0OTMyMzQzMjRiMzM0YTM0MzEzNjM3YWQwNTAwZDY3ODBhOTE=
\`\`\``,
    category: "FOR", difficulty: "Hard", base_points: 500,
    flag: "flag{77137cc19d7147013a77db126f2a4375}",
    hints: [{"text_en": "Three layers: try identifying each one", "text_th": "สามชั้น: ลองระบุแต่ละชั้น", "penalty_pct": 0}, {"text_en": "Layer 1: Base64. Layer 2: Hex. Layer 3: ?", "text_th": "ชั้น 1: Base64. ชั้น 2: Hex. ชั้น 3: ?", "penalty_pct": 25}, {"text_en": "Base64 → hex string → zlib decompress", "text_th": "Base64 → hex string → zlib decompress", "penalty_pct": 50}],
    solution_th: "zlib.decompress(bytes.fromhex(base64.b64decode('Nzg5YzRiY2I0OTRjYWYzNjM3MzczNDM2NGY0ZTM2YjQ0YzMxMzczNDMxMzczMDM0NGUzNDM3NGY0OTMyMzQzMjRiMzM0YTM0MzEzNjM3YWQwNTAwZDY3ODBhOTE=').decode())).decode()",
    visible: true,
  },
  {
    title_en: "Scrambled Hex", title_th: "Hex \u0e1b\u0e19\u0e40\u0e1b\u0e37\u0e49\u0e2d\u0e19",
    description_en: `This hex dump was scrambled. Something looks odd about the characters...

\`\`\`
666p61677o64373838663266353933303139636466636632376662653032356136643539327q
\`\`\``,
    description_th: `Hex dump นี้ถูกปน เห็นบางอย่างแปลกๆ เกี่ยวกับตัวอักษร...

\`\`\`
666p61677o64373838663266353933303139636466636632376662653032356136643539327q
\`\`\``,
    category: "FOR", difficulty: "Medium", base_points: 300,
    flag: "flag{d788f2f593019cdfcf27fbe025a6d592}",
    hints: [{"text_en": "Hex strings should only contain 0-9 and a-f. Anything else is suspicious.", "text_th": "Hex string ควรมีแค่ 0-9 และ a-f อะไรอื่นน่าสงสัย", "penalty_pct": 0}, {"text_en": "The letters seem rotated...", "text_th": "ตัวอักษรดูเหมือนถูกหมุน...", "penalty_pct": 25}],
    solution_th: "bytes.fromhex(codecs.decode('666p61677o64373838663266353933303139636466636632376662653032356136643539327q','rot_13')).decode()",
    visible: true,
  },
  {
    title_en: "JWT Exposed", title_th: "JWT \u0e17\u0e35\u0e48\u0e40\u0e1b\u0e34\u0e14\u0e40\u0e1c\u0e22",
    description_en: `A developer accidentally leaked a JWT token in the frontend code. Decode the payload — no secret key needed for reading.

\`\`\`
eyJhbGciOiAiSFMyNTYiLCAidHlwIjogIkpXVCJ9.eyJ1c2VyIjogInN0dWRlbnQiLCAiZmxhZyI6ICJmbGFnezBjOTM4NTRlYTdhN2FjODVkOTI2ZjE5OGZmZDczZTMxfSIsICJleHAiOiA5OTk5OTk5OTk5fQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
\`\`\``,
    description_th: `นักพัฒนาทำ JWT token หลุดออกมาในโค้ด frontend โดยไม่ตั้งใจ ถอดรหัส payload — ไม่ต้องการ secret key สำหรับอ่าน

\`\`\`
eyJhbGciOiAiSFMyNTYiLCAidHlwIjogIkpXVCJ9.eyJ1c2VyIjogInN0dWRlbnQiLCAiZmxhZyI6ICJmbGFnezBjOTM4NTRlYTdhN2FjODVkOTI2ZjE5OGZmZDczZTMxfSIsICJleHAiOiA5OTk5OTk5OTk5fQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
\`\`\``,
    category: "WEB", difficulty: "Medium", base_points: 300,
    flag: "flag{0c93854ea7a7ac85d926f198ffd73e31}",
    hints: [{"text_en": "A JWT has 3 parts separated by dots: header.payload.signature", "text_th": "JWT มี 3 ส่วนคั่นด้วยจุด: header.payload.signature", "penalty_pct": 0}, {"text_en": "The payload is Base64url encoded (add padding '=' if needed)", "text_th": "payload ถูก encode แบบ Base64url (เติม '=' ถ้าจำเป็น)", "penalty_pct": 25}, {"text_en": "Decode the middle part: eyJ1c2VyIjogInN0dWRlbnQiLCAiZmxhZyI6ICJmbGFnezBjOTM4NTRlYTdhN2FjODVkOTI2ZjE5OGZmZDczZTMxfSIsICJleHAiOiA5OTk5OTk5OTk5fQ", "text_th": "Decode ส่วนกลาง", "penalty_pct": 50}],
    solution_th: "json.loads(base64.b64decode('eyJ1c2VyIjogInN0dWRlbnQiLCAiZmxhZyI6ICJmbGFnezBjOTM4NTRlYTdhN2FjODVkOTI2ZjE5OGZmZDczZTMxfSIsICJleHAiOiA5OTk5OTk5OTk5fQ=='))",
    visible: true,
  },
  {
    title_en: "Header Hunt", title_th: "\u0e25\u0e48\u0e32 Header",
    description_en: `Some clues are hidden in HTTP response headers, not the body.

Make a request to \`/api/challenge/header\` and check all the response headers.`,
    description_th: `บางเบาะแสซ่อนอยู่ใน HTTP response headers ไม่ใช่ body

ส่ง request ไปที่ \`/api/challenge/header\` แล้วตรวจสอบ headers ทั้งหมด`,
    category: "WEB", difficulty: "Easy", base_points: 100,
    flag: "flag{9cf4886a09240112cc61b0616305f0a5}",
    hints: [{"text_en": "Use DevTools (F12) → Network tab to see all headers", "text_th": "ใช้ DevTools (F12) → Network tab เพื่อดู headers ทั้งหมด", "penalty_pct": 0}, {"text_en": "curl -I https://... to see response headers", "text_th": "curl -I https://... เพื่อดู response headers", "penalty_pct": 25}, {"text_en": "Look for X-Flag header", "text_th": "มองหา X-Flag header", "penalty_pct": 50}],
    solution_th: "check X-Flag response header",
    visible: true,
  },
  {
    title_en: "Source Code Secrets", title_th: "\u0e04\u0e27\u0e32\u0e21\u0e25\u0e31\u0e1a\u0e43\u0e19\u0e0b\u0e2d\u0e23\u0e4c\u0e2a\u0e42\u0e04\u0e49\u0e14",
    description_en: `Developers sometimes leave notes in the source code. View the page source of \`/challenge/source\`.

*Right-click → View Page Source, or Ctrl+U*`,
    description_th: `นักพัฒนาบางครั้งทิ้งหมายเหตุไว้ในซอร์สโค้ด ดู page source ของ \`/challenge/source\`

*คลิกขวา → View Page Source หรือ Ctrl+U*`,
    category: "WEB", difficulty: "Easy", base_points: 100,
    flag: "flag{af43d09827c1cf9fd71e46a1645ddffd}",
    hints: [{"text_en": "Every browser can show the raw HTML of a page", "text_th": "เบราว์เซอร์ทุกตัวแสดง HTML ดิบของหน้าเว็บได้", "penalty_pct": 0}, {"text_en": "Search for 'flag' in the source code", "text_th": "ค้นหา 'flag' ในซอร์สโค้ด", "penalty_pct": 25}],
    solution_th: "Ctrl+U \u2192 search for flag",
    visible: true,
  },
  {
    title_en: "Cookie Hex", title_th: "\u0e04\u0e38\u0e01\u0e01\u0e35\u0e49\u0e40\u0e2e\u0e47\u0e01\u0e0b\u0e4c",
    description_en: `Another hidden cookie, but this time encoded differently.

1. Visit \`/api/challenge/cookie-hex\`
2. Open DevTools → Application → Cookies
3. Find the \`auth_token\` cookie and decode it`,
    description_th: `คุกกี้ที่ซ่อนอยู่อีกอัน แต่ครั้งนี้เข้ารหัสต่างออกไป

1. ไปที่ \`/api/challenge/cookie-hex\`
2. เปิด DevTools → Application → Cookies
3. หา \`auth_token\` cookie แล้วถอดรหัส`,
    category: "WEB", difficulty: "Easy", base_points: 100,
    flag: "flag{56257dc53945ff98785def6138c1c0f5}",
    hints: [{"text_en": "The cookie value looks like hex (only 0-9 and a-f)", "text_th": "ค่า cookie ดูเหมือน hex (มีแค่ 0-9 และ a-f)", "penalty_pct": 0}, {"text_en": "python: bytes.fromhex(cookie_value).decode()", "text_th": "python: bytes.fromhex(cookie_value).decode()", "penalty_pct": 25}],
    solution_th: "bytes.fromhex('666c61677b35363235376463353339343566663938373835646566363133386331633066357d').decode()",
    visible: true,
  },
  {
    title_en: "Param Hunter", title_th: "\u0e19\u0e31\u0e01\u0e25\u0e48\u0e32 Parameter",
    description_en: `Hidden parameters unlock hidden content.

Visit \`/api/challenge/param\` — the response seems empty. But what if you add the right query parameter?

*Hint: the parameter name is in the URL above*`,
    description_th: `Parameters ที่ซ่อนอยู่เปิดเนื้อหาที่ซ่อนอยู่

ไปที่ \`/api/challenge/param\` — response ดูว่างเปล่า แต่ถ้าเพิ่ม query parameter ที่ถูกต้องล่ะ?

*Hint: ชื่อ parameter อยู่ใน URL ด้านบน*`,
    category: "WEB", difficulty: "Medium", base_points: 300,
    flag: "flag{805463a7d0b903cbb77a2bd66a116bd0}",
    hints: [{"text_en": "Try adding ?key=value to the URL", "text_th": "ลองเพิ่ม ?key=value ต่อท้าย URL", "penalty_pct": 0}, {"text_en": "The parameter is named 'secret'", "text_th": "ชื่อ parameter คือ 'secret'", "penalty_pct": 25}, {"text_en": "?secret=crms6", "text_th": "?secret=crms6", "penalty_pct": 50}],
    solution_th: "visit /api/challenge/param?secret=crms6",
    visible: true,
  },
  {
    title_en: "Console Secret", title_th: "\u0e04\u0e27\u0e32\u0e21\u0e25\u0e31\u0e1a\u0e43\u0e19 Console",
    description_en: `The developer hid something in the JavaScript. Open \`/challenge/console\` and check the browser console (F12).`,
    description_th: `นักพัฒนาซ่อนบางอย่างใน JavaScript เปิด \`/challenge/console\` แล้วตรวจสอบ browser console (F12)`,
    category: "WEB", difficulty: "Medium", base_points: 300,
    flag: "flag{533b13276cd2da67b9db0389368d77c0}",
    hints: [{"text_en": "Open DevTools (F12) → Console tab", "text_th": "เปิด DevTools (F12) → Console tab", "penalty_pct": 0}, {"text_en": "Type: secretFlag in the console", "text_th": "พิมพ์: secretFlag ใน console", "penalty_pct": 25}],
    solution_th: "F12 \u2192 Console \u2192 type secretFlag",
    visible: true,
  },
  {
    title_en: "Admin Bypass", title_th: "\u0e40\u0e25\u0e35\u0e48\u0e22\u0e07 Admin",
    description_en: `The admin panel is at \`/api/challenge/admin\`. But it returns 403 Forbidden.

Maybe the server checks something in the request headers?`,
    description_th: `admin panel อยู่ที่ \`/api/challenge/admin\` แต่คืน 403 Forbidden

บางทีเซิร์ฟเวอร์ตรวจสอบบางอย่างใน request headers?`,
    category: "WEB", difficulty: "Hard", base_points: 500,
    flag: "flag{d72b45d80807430f2c3595d8f23e8bae}",
    hints: [{"text_en": "403 = Forbidden. The server rejected your request.", "text_th": "403 = Forbidden เซิร์ฟเวอร์ปฏิเสธ request ของคุณ", "penalty_pct": 0}, {"text_en": "Try adding a header: X-Admin: true", "text_th": "ลองเพิ่ม header: X-Admin: true", "penalty_pct": 25}, {"text_en": "curl -H 'X-Admin: true' /api/challenge/admin", "text_th": "curl -H 'X-Admin: true' /api/challenge/admin", "penalty_pct": 50}],
    solution_th: "curl -H 'X-Admin: true' /api/challenge/admin",
    visible: true,
  },
  {
    title_en: "Sitemap Recon", title_th: "\u0e2a\u0e33\u0e23\u0e27\u0e08 Sitemap",
    description_en: `Websites often have a sitemap that lists all pages — including ones not linked anywhere.

Check \`/sitemap.xml\` for hidden paths.`,
    description_th: `เว็บไซต์มักมี sitemap ที่แสดงรายการหน้าทั้งหมด รวมถึงหน้าที่ไม่ได้ link ไว้

ตรวจสอบ \`/sitemap.xml\` เพื่อหา path ที่ซ่อนอยู่`,
    category: "WEB", difficulty: "Medium", base_points: 300,
    flag: "flag{fdaaa408b9bc1f6587d21f6900a858d6}",
    hints: [{"text_en": "A sitemap.xml lists URLs for search engines", "text_th": "sitemap.xml แสดง URL สำหรับ search engines", "penalty_pct": 0}, {"text_en": "Look for unusual or secret paths in sitemap.xml", "text_th": "มองหา path ที่ผิดปกติหรือเป็นความลับใน sitemap.xml", "penalty_pct": 25}],
    solution_th: "visit /sitemap.xml \u2192 find hidden path \u2192 visit it",
    visible: true,
  },
  {
    title_en: "Reverse Me", title_th: "\u0e22\u0e49\u0e2d\u0e19\u0e09\u0e31\u0e19",
    description_en: `This program outputs text backwards.

\`\`\`python
s = '}afc8cef775256be5d5d991c5cc5fb282{galf'
print(s)  # What should s[::-1] output?
\`\`\``,
    description_th: `โปรแกรมนี้แสดงข้อความกลับหลัง

\`\`\`python
s = '}afc8cef775256be5d5d991c5cc5fb282{galf'
print(s)  # s[::-1] จะได้อะไร?
\`\`\``,
    category: "REV", difficulty: "Easy", base_points: 100,
    flag: "flag{282bf5cc5c199d5d5eb652577fec8cfa}",
    hints: [{"text_en": "Trace the code: what does s[::-1] do?", "text_th": "ติดตามโค้ด: s[::-1] ทำอะไร?", "penalty_pct": 0}, {"text_en": "python: s[::-1] reverses a string", "text_th": "python: s[::-1] กลับ string", "penalty_pct": 25}],
    solution_th: "'}afc8cef775256be5d5d991c5cc5fb282{galf'[::-1]",
    visible: true,
  },
  {
    title_en: "Chr Maze", title_th: "\u0e40\u0e02\u0e32\u0e27\u0e07\u0e01\u0e15 Chr",
    description_en: `A developer tried to hide the flag by converting it to \`chr()\` calls.

\`\`\`python
flag = chr(102)+chr(108)+chr(97)+chr(103)+chr(123)+chr(101)+chr(52)+chr(49)+chr(53)+chr(51)+chr(48)+chr(100)+chr(48)+chr(56)+chr(50)+chr(102)+chr(53)+chr(102)+chr(101)+chr(50)+chr(50)+chr(48)+chr(50)+chr(98)+chr(97)+chr(99)+chr(50)+chr(51)+chr(49)+chr(99)+chr(97)+chr(50)+chr(50)+chr(53)+chr(98)+chr(101)+chr(53)+chr(125)
print(flag)
\`\`\`
What does this print?`,
    description_th: `นักพัฒนาพยายามซ่อน flag โดยแปลงเป็น \`chr()\` calls

\`\`\`python
flag = chr(102)+chr(108)+chr(97)+chr(103)+chr(123)+chr(101)+chr(52)+chr(49)+chr(53)+chr(51)+chr(48)+chr(100)+chr(48)+chr(56)+chr(50)+chr(102)+chr(53)+chr(102)+chr(101)+chr(50)+chr(50)+chr(48)+chr(50)+chr(98)+chr(97)+chr(99)+chr(50)+chr(51)+chr(49)+chr(99)+chr(97)+chr(50)+chr(50)+chr(53)+chr(98)+chr(101)+chr(53)+chr(125)
print(flag)
\`\`\`
จะพิมพ์ว่าอะไร?`,
    category: "REV", difficulty: "Easy", base_points: 100,
    flag: "flag{e41530d082f5fe2202bac231ca225be5}",
    hints: [{"text_en": "chr(102) = 'f', chr(108) = 'l', chr(97) = 'a', chr(103) = 'g'", "text_th": "chr(102) = 'f', chr(108) = 'l', chr(97) = 'a', chr(103) = 'g'", "penalty_pct": 0}, {"text_en": "Just run the Python code!", "text_th": "แค่รันโค้ด Python!", "penalty_pct": 25}],
    solution_th: "run the Python code",
    visible: true,
  },
  {
    title_en: "Key in Code", title_th: "\u0e01\u0e38\u0e0d\u0e41\u0e08\u0e43\u0e19\u0e42\u0e04\u0e49\u0e14",
    description_en: `The decryption key is right there in the code. Read carefully.

\`\`\`python
KEY = 0x5A
data = bytes.fromhex('3c363b3d213c6e3f3b6a3c6c623e6d6d3e6c6b3c69693e3f6c6f6e3c3c6b396b626d6b633927')
result = bytes(b ^ KEY for b in data)
print(result)  # What does this print?
\`\`\``,
    description_th: `กุญแจถอดรหัสอยู่ในโค้ดแล้ว อ่านดีๆ

\`\`\`python
KEY = 0x5A
data = bytes.fromhex('3c363b3d213c6e3f3b6a3c6c623e6d6d3e6c6b3c69693e3f6c6f6e3c3c6b396b626d6b633927')
result = bytes(b ^ KEY for b in data)
print(result)  # จะพิมพ์ว่าอะไร?
\`\`\``,
    category: "REV", difficulty: "Medium", base_points: 300,
    flag: "flag{f4ea0f68d77d61f33de654ff1c18719c}",
    hints: [{"text_en": "Trace the code step by step", "text_th": "ติดตามโค้ดทีละขั้น", "penalty_pct": 0}, {"text_en": "Just run it! Or XOR manually.", "text_th": "แค่รันเลย! หรือ XOR ด้วยตนเอง", "penalty_pct": 25}],
    solution_th: "bytes(b^0x5A for b in bytes.fromhex('3c363b3d213c6e3f3b6a3c6c623e6d6d3e6c6b3c69693e3f6c6f6e3c3c6b396b626d6b633927')).decode()",
    visible: true,
  },
  {
    title_en: "Eval Labyrinth", title_th: "\u0e40\u0e02\u0e32\u0e27\u0e07\u0e01\u0e15 Eval",
    description_en: `Obfuscated JavaScript. What does this output?

\`\`\`javascript
var x = [102,108,97,103,123,54,54,48,48,54,52,56,101,100,101,50,52,54,50,100,97,55,51,97,100,54,53,49,48,54,53,53,50,48,99,52,98,125];
var r = x.map(c => String.fromCharCode(c)).join('');
console.log(r);
\`\`\``,
    description_th: `JavaScript ที่ถูก obfuscate จะได้ผลลัพธ์อะไร?

\`\`\`javascript
var x = [102,108,97,103,123,54,54,48,48,54,52,56,101,100,101,50,52,54,50,100,97,55,51,97,100,54,53,49,48,54,53,53,50,48,99,52,98,125];
var r = x.map(c => String.fromCharCode(c)).join('');
console.log(r);
\`\`\``,
    category: "REV", difficulty: "Medium", base_points: 300,
    flag: "flag{6600648ede2462da73ad651065520c4b}",
    hints: [{"text_en": "String.fromCharCode(n) converts a number to a character", "text_th": "String.fromCharCode(n) แปลงตัวเลขเป็นตัวอักษร", "penalty_pct": 0}, {"text_en": "Run it in browser console (F12) or Node.js", "text_th": "รันใน browser console (F12) หรือ Node.js", "penalty_pct": 25}],
    solution_th: "run in browser console",
    visible: true,
  },
  {
    title_en: "Custom Codec", title_th: "Codec \u0e17\u0e35\u0e48\u0e2a\u0e23\u0e49\u0e32\u0e07\u0e40\u0e2d\u0e07",
    description_en: `A developer wrote their own encoding function. Reverse engineer it.

\`\`\`python
def encode(s):
    return ''.join(chr(ord(c)+13) if ord(c)+13 < 128 else chr(ord(c)-114) for c in s)

encoded = 'synt	CoprppBq@rorqAp>n>>pF@psFsCrCoFB'
# What is encode_inverse(encoded)?
\`\`\``,
    description_th: `นักพัฒนาเขียน encoding function เอง ทำ reverse engineering

\`\`\`python
def encode(s):
    return ''.join(chr(ord(c)+13) if ord(c)+13 < 128 else chr(ord(c)-114) for c in s)

encoded = 'synt	CoprppBq@rorqAp>n>>pF@psFsCrCoFB'
# encode_inverse(encoded) = ?
\`\`\``,
    category: "REV", difficulty: "Medium", base_points: 300,
    flag: "flag{6bcecc5d3ebed4c1a11c93cf9f6e6b95}",
    hints: [{"text_en": "Understand what the encode function does: shift each char by +13", "text_th": "ทำความเข้าใจ encode function: เลื่อนแต่ละตัวอักษร +13", "penalty_pct": 0}, {"text_en": "To reverse: shift each char by -13", "text_th": "ในการ reverse: เลื่อนแต่ละตัวอักษร -13", "penalty_pct": 25}],
    solution_th: "apply inverse: chr(ord(c)-13) for each char",
    visible: true,
  },
  {
    title_en: "Double Caesar", title_th: "Caesar \u0e2a\u0e2d\u0e07\u0e0a\u0e31\u0e49\u0e19",
    description_en: `The program ran Caesar cipher twice with different keys.

\`\`\`python
def encrypt(s):
    s = caesar(s, 3)   # first shift
    s = caesar(s, 10)  # second shift
    return s

encrypted = 'synt{9orpn5pqn653o87n5220p5839n73s49q}'
# decrypt(encrypted) = ?
\`\`\``,
    description_th: `โปรแกรมรัน Caesar cipher สองครั้งด้วย key ต่างกัน

\`\`\`python
def encrypt(s):
    s = caesar(s, 3)   # เลื่อนครั้งแรก
    s = caesar(s, 10)  # เลื่อนครั้งที่สอง
    return s

encrypted = 'synt{9orpn5pqn653o87n5220p5839n73s49q}'
# decrypt(encrypted) = ?
\`\`\``,
    category: "REV", difficulty: "Hard", base_points: 500,
    flag: "flag{9beca5cda653b87a5220c5839a73f49d}",
    hints: [{"text_en": "Two Caesar shifts applied in sequence", "text_th": "Caesar shift สองครั้งต่อเนื่องกัน", "penalty_pct": 0}, {"text_en": "Reverse order matters: undo shift 10 first, then shift 3", "text_th": "ลำดับย้อนกลับสำคัญ: แก้ shift 10 ก่อน แล้ว shift 3", "penalty_pct": 25}, {"text_en": "Total shift = 3+10=13 = ROT13! Apply ROT13 once.", "text_th": "รวม shift = 3+10=13 = ROT13! ใช้ ROT13 ครั้งเดียว", "penalty_pct": 50}],
    solution_th: "caesar('synt{9orpn5pqn653o87n5220p5839n73s49q}', -13)  # or ROT13",
    visible: true,
  },
  {
    title_en: "Bytecode Puzzle", title_th: "\u0e1b\u0e23\u0e34\u0e28\u0e19\u0e32 Bytecode",
    description_en: `Trace this pseudobytecode to find the flag content.

\`\`\`
PUSH  'ebb4b546740c80a88d5be5fcfcca35d2'
CALL  swap_digits    ; swap: 0↔9, 1↔8, 2↔7, 3↔6, 4↔5
CALL  wrap_flag      ; wrap in flag{...}
RET
\`\`\``,
    description_th: `ติดตาม pseudobytecode นี้เพื่อหาเนื้อหา flag

\`\`\`
PUSH  'ebb4b546740c80a88d5be5fcfcca35d2'
CALL  swap_digits    ; swap: 0↔9, 1↔8, 2↔7, 3↔6, 4↔5
CALL  wrap_flag      ; ห่อด้วย flag{...}
RET
\`\`\``,
    category: "REV", difficulty: "Hard", base_points: 500,
    flag: "flag{ebb5b453259c19a11d4be4fcfcca64d7}",
    hints: [{"text_en": "Trace each CALL instruction", "text_th": "ติดตามแต่ละ CALL instruction", "penalty_pct": 0}, {"text_en": "swap_digits: each digit d becomes (9-d)", "text_th": "swap_digits: แต่ละตัวเลข d กลายเป็น (9-d)", "penalty_pct": 25}],
    solution_th: "swap each digit d\u2192(9-d) in 'ebb4b546740c80a88d5be5fcfcca35d2' \u2192 wrap in flag{}",
    visible: true,
  },
  {
    title_en: "Compile Secret", title_th: "\u0e04\u0e27\u0e32\u0e21\u0e25\u0e31\u0e1a\u0e17\u0e35\u0e48\u0e04\u0e2d\u0e21\u0e44\u0e1e\u0e25\u0e4c",
    description_en: `A compiled function hides the flag. Analyze and run it.

\`\`\`python
import ctypes

data = bytes.fromhex('5c10164419421447474310194014131718471015431216111314434047161710135a46404d47')

def extract():
    step1 = bytes(b ^ 0x21 for b in data).decode()
    return step1[::-1]

print(extract())
\`\`\``,
    description_th: `ฟังก์ชันที่คอมไพล์แล้วซ่อน flag ไว้ วิเคราะห์และรันมัน

\`\`\`python
data = bytes.fromhex('5c10164419421447474310194014131718471015431216111314434047161710135a46404d47')

def extract():
    step1 = bytes(b ^ 0x21 for b in data).decode()
    return step1[::-1]

print(extract())
\`\`\``,
    category: "REV", difficulty: "Expert", base_points: 1000,
    flag: "flag{2167fab52073b41f9625a81bff5c8e71}",
    hints: [{"text_en": "Trace the function: XOR then reverse", "text_th": "ติดตามฟังก์ชัน: XOR แล้วกลับ string", "penalty_pct": 0}, {"text_en": "Step 1: XOR each byte with 0x21. Step 2: reverse the result", "text_th": "ขั้น 1: XOR แต่ละ byte ด้วย 0x21. ขั้น 2: กลับผลลัพธ์", "penalty_pct": 25}],
    solution_th: "bytes(b^0x21 for b in bytes.fromhex('5c10164419421447474310194014131718471015431216111314434047161710135a46404d47')).decode()[::-1]",
    visible: true,
  },
]

export default function Seed2Page() {
  const { profile, user } = useAuth()
  const { locale } = useParams()
  const router = useRouter()
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [log, setLog] = useState<string[]>([])
  const [count, setCount] = useState(0)

  if (profile?.role !== 'coach') return (
    <div className="text-center py-16 text-red-400 font-mono text-sm">
      Access denied — uid: {user?.uid || 'not logged in'}
    </div>
  )

  const addLog = (msg: string) => setLog(l => [...l, msg])

  const runSeed2 = async () => {
    setStatus('running')
    setLog([])
    try {
      const currentUser = auth.currentUser
      if (!currentUser) { addLog('❌ ไม่มี auth session'); setStatus('error'); return }
      await currentUser.getIdToken(true)
      addLog('token refreshed ✓')
      for (const ch of CHALLENGES_2) {
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
      addLog(`\n✅ เสร็จแล้ว! ${CHALLENGES_2.length} โจทย์`)
      setStatus('done')
    } catch (e: any) {
      addLog(`❌ Error: ${e.message}`)
      setStatus('error')
    }
  }

  const cats = ['GEN','CRYPTO','MISC','FOR','WEB','REV']

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push(`/${locale}/coach`)} className="text-gray-500 hover:text-gray-300 text-sm">← กลับ</button>
        <h1 className="text-xl font-bold text-cyan-400">Seed Challenges — Batch 2</h1>
      </div>

      <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 text-sm text-blue-300">
        📦 Batch 2 — เพิ่มโจทย์อีก {CHALLENGES_2.length} ข้อเข้า Firestore<br />
        (โจทย์เดิม 12 ข้อจาก Seed Batch 1 ยังคงอยู่)
      </div>

      <div className="grid grid-cols-3 gap-3 text-center text-xs">
        {cats.map(cat => {
          const n = CHALLENGES_2.filter(c => c.category === cat).length
          return (
            <div key={cat} className="bg-gray-900 border border-gray-700 rounded-lg p-3">
              <div className="font-mono text-cyan-400">{cat}</div>
              <div className="text-gray-400">{n} โจทย์</div>
            </div>
          )
        })}
      </div>

      {status === 'idle' && (
        <button onClick={runSeed2} className="w-full bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold py-3 rounded-lg transition-colors">
          เริ่ม Seed Batch 2 ({CHALLENGES_2.length} โจทย์)
        </button>
      )}
      {status === 'running' && (
        <div className="text-center text-cyan-400 py-4">กำลัง seed... ({count}/{CHALLENGES_2.length})</div>
      )}
      {status === 'done' && (
        <div className="flex gap-3">
          <div className="flex-1 bg-green-900/20 border border-green-700 text-green-400 rounded-lg p-3 text-sm text-center">✅ Seed สำเร็จ!</div>
          <button onClick={() => router.push(`/${locale}/coach`)} className="bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold px-6 rounded-lg">
            ไปดู Dashboard
          </button>
        </div>
      )}
      {log.length > 0 && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 font-mono text-xs text-gray-300 space-y-0.5 max-h-96 overflow-y-auto">
          {log.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      )}
    </div>
  )
}

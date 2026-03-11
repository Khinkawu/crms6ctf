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
    description_th: 'ยินดีต้อนรับสู่ CRMS6 CTF!\n\nทีมวิจัยพบข้อความลึกลับบนเซิร์ฟเวอร์ที่ถูกทิ้งร้าง มันถูกแปลงเป็นรูปแบบแปลกๆ ก่อนบันทึกเอาไว้ คุณช่วยอ่านมันออกได้ไหม?\n\nZmxhZ3tmODRlMGIxMGJmNzE5ZjBmNDdhYTlkYmFlY2IxZTlmNH0=',
    description_en: 'Welcome to CRMS6 CTF!\n\nThe research team found a mysterious message on an abandoned server. It was converted into a strange format before being saved. Can you read it?\n\nZmxhZ3tmODRlMGIxMGJmNzE5ZjBmNDdhYTlkYmFlY2IxZTlmNH0=',
    category: 'GEN', difficulty: 'Easy', base_points: 100,
    flag: 'flag{f84e0b10bf719f0f47aa9dbaecb1e9f4}',
    hints: [
      { text_th: 'สังเกตตัวอักษรที่ใช้: A-Z, a-z, 0-9 ผสมกัน และลงท้ายด้วย =', text_en: 'Notice the characters used: A-Z, a-z, 0-9 mixed together, ending with =', penalty_pct: 0 },
      { text_th: 'Encoding นี้ชื่อ Base64 — ใช้แปลงข้อมูล binary เป็น text', text_en: 'This encoding is called Base64 — used to convert binary data to text', penalty_pct: 25 },
      { text_th: 'CyberChef → From Base64  หรือ  python3: base64.b64decode("...").decode()', text_en: 'CyberChef → From Base64  or  python3: base64.b64decode("...").decode()', penalty_pct: 50 },
    ],
    solution_th: 'Base64 decode → flag{f84e0b10bf719f0f47aa9dbaecb1e9f4}',
    writeup_th: 'Base64 คือ encoding มาตรฐานที่แปลง binary เป็น text โดยใช้ตัวอักษร 64 ตัว (A-Z, a-z, 0-9, +, /)\n\nวิธีสังเกต: ตัวอักษรเฉพาะกลุ่มนี้ และมักลงท้ายด้วย = หรือ == (padding)\n\nเครื่องมือ:\n• CyberChef (cyberchef.org) → From Base64\n• python3: import base64; base64.b64decode("Zmxh...").decode()\n• Terminal: echo "Zmxh..." | base64 -d',
    writeup_en: 'Base64 is a standard encoding that converts binary data to text using 64 characters (A-Z, a-z, 0-9, +, /)\n\nHow to spot it: This specific character set, often ending with = or == (padding)\n\nTools:\n• CyberChef (cyberchef.org) → From Base64\n• python3: import base64; base64.b64decode("Zmxh...").decode()\n• Terminal: echo "Zmxh..." | base64 -d',
    visible: true,
  },
  {
    title_th: 'อาหารเช้า Binary', title_en: 'Binary Breakfast',
    description_th: 'ข้อความนี้ถูกค้นพบในบันทึกเก่าของระบบ มีแต่ตัวเลขสองชนิดสลับกันอย่างเป็นระบบ — มันหมายความว่าอะไร?\n\n01100110 01101100 01100001 01100111 01111011 01100110 00110000 00111000 00110001 00110101 01100011 00110001 00110001 00110011 01100101 00110111 00110110 00110110 00111000 00111001 00110110 00111001 00110100 00110000 01100101 00111001 00110101 00110111 00111001 00110000 00111000 00111001 00111001 00110110 00111000 01100010 00110001 01111101',
    description_en: 'This message was found in old system logs — just two kinds of digits arranged in a pattern. What does it mean?\n\n01100110 01101100 01100001 01100111 01111011 01100110 00110000 00111000 00110001 00110101 01100011 00110001 00110001 00110011 01100101 00110111 00110110 00110110 00111000 00111001 00110110 00111001 00110100 00110000 01100101 00111001 00110101 00110111 00111001 00110000 00111000 00111001 00111001 00110110 00111000 01100010 00110001 01111101',
    category: 'GEN', difficulty: 'Easy', base_points: 100,
    flag: 'flag{f0815c113e766896940e9579089968b1}',
    hints: [
      { text_th: 'ตัวเลขทั้งหมดมีแค่ 0 กับ 1 เรียงเป็นกลุ่มละ 8 ตัว — นับดูสิว่ากลุ่มละกี่ตัว', text_en: 'All digits are just 0 and 1 in groups of 8 — count how many per group', penalty_pct: 0 },
      { text_th: 'คอมพิวเตอร์ใช้เลขฐานสอง (Binary) 8 bits = 1 byte = 1 ตัวอักษร ASCII', text_en: 'Computers use binary. 8 bits = 1 byte = 1 ASCII character', penalty_pct: 25 },
      { text_th: 'CyberChef → From Binary  หรือ  python3: chr(int("01100110", 2)) = "f"', text_en: 'CyberChef → From Binary  or  python3: chr(int("01100110", 2)) = "f"', penalty_pct: 50 },
    ],
    solution_th: "Binary → ASCII → flag{f0815c113e766896940e9579089968b1}",
    writeup_th: 'Binary (เลขฐานสอง) คือภาษาพื้นฐานของคอมพิวเตอร์ แต่ละ bit คือ 0 หรือ 1\n8 bits = 1 byte = 1 ตัวอักษร ASCII\n\nวิธีสังเกต: มีแต่ 0 กับ 1 เรียงเป็นกลุ่มๆ ละ 8 ตัว\n\nเครื่องมือ:\n• CyberChef → From Binary\n• python3: "".join(chr(int(b,2)) for b in data.split())\n• RapidTables Binary to Text Converter',
    writeup_en: 'Binary is the base language of computers. Each bit is 0 or 1.\n8 bits = 1 byte = 1 ASCII character\n\nHow to spot it: Only 0s and 1s in groups of 8\n\nTools:\n• CyberChef → From Binary\n• python3: "".join(chr(int(b,2)) for b in data.split())\n• RapidTables Binary to Text Converter',
    visible: true,
  },
  // ── CRYPTO ──
  {
    title_th: 'ผีของซีซาร์', title_en: "Caesar's Ghost",
    description_th: 'นักโบราณคดีพบแผ่นจารึกลึกลับในซากโรมโบราณ ข้อความดูเหมือนภาษาอังกฤษ แต่อ่านแล้วไม่มีความหมาย ตัวอักษรทุกตัวเหมือนถูกเปลี่ยนไปอย่างเป็นระบบ...\n\nsynt{26r720122sr34oro1o49rq96264rn86s}',
    description_en: 'Archaeologists found a mysterious inscription in the ruins of ancient Rome. The text looks like English but makes no sense. Every letter seems to have been systematically changed...\n\nsynt{26r720122sr34oro1o49rq96264rn86s}',
    category: 'CRYPTO', difficulty: 'Easy', base_points: 100,
    flag: 'flag{26e720122fe34beb1b49ed96264ea86f}',
    hints: [
      { text_th: 'ลองนับดู — ตัวอักษรทุกตัวถูกเลื่อนไปกี่ตำแหน่งจากปกติ?', text_en: 'Try counting — how many positions is each letter shifted from normal?', penalty_pct: 0 },
      { text_th: 'Julius Caesar ใช้วิธีนี้ส่งข้อความลับ — เรียกว่า Caesar Cipher หรือ Shift Cipher', text_en: 'Julius Caesar used this method to send secret messages — called Caesar Cipher or Shift Cipher', penalty_pct: 25 },
      { text_th: 'ROT13 = shift 13 ตำแหน่ง — python: import codecs; codecs.decode("synt{...}", "rot_13")', text_en: 'ROT13 = shift by 13 positions — python: import codecs; codecs.decode("synt{...}", "rot_13")', penalty_pct: 50 },
    ],
    solution_th: 'ROT13: synt → flag → flag{26e720122fe34beb1b49ed96264ea86f}',
    writeup_th: 'Caesar Cipher คือการเลื่อนตัวอักษรทีละ N ตำแหน่ง ข้อนี้ใช้ ROT13 (shift = 13)\n\nวิธีสังเกต: ข้อความดูเหมือนภาษาอังกฤษแต่อ่านไม่ออก ตัวอักษรทุกตัวเลื่อนเท่ากัน\n\nเครื่องมือ:\n• CyberChef → ROT13\n• python3: import codecs; codecs.decode("synt{...}", "rot_13")\n• dcode.fr → Caesar Cipher (ลอง shift ทุกค่า 1-25)\n• rot13.com',
    writeup_en: 'Caesar Cipher shifts each letter by N positions. This challenge uses ROT13 (shift = 13)\n\nHow to spot it: Text looks like English but is unreadable. Each letter shifted the same amount.\n\nTools:\n• CyberChef → ROT13\n• python3: import codecs; codecs.decode("synt{...}", "rot_13")\n• dcode.fr → Caesar Cipher (try all shifts 1-25)\n• rot13.com',
    visible: true,
  },
  {
    title_th: 'ท่อสองชั้น', title_en: 'Double Pipe',
    description_th: 'สายลับส่งข้อมูลด้วยวิธีที่แปลกมาก — ซ่อนซ้อนกันมากกว่า 1 ชั้น ต้องลอกออกทีละชั้นจนกว่าจะพบของจริง\n\nTVpXR0NaMzNHUTNET05SUUdWUldNWVRETU00RElOTEVHRlNUS01EQ0dGUldHWkJSR1EyREVaREdHWTJIMj09PQ==',
    description_en: 'A spy sent data in a very strange way — hidden in more than one layer. You must peel each layer until you find the real thing.\n\nTVpXR0NaMzNHUTNET05SUUdWUldNWVRETU00RElOTEVHRlNUS01EQ0dGUldHWkJSR1EyREVaREdHWTJIMj09PQ==',
    category: 'CRYPTO', difficulty: 'Easy', base_points: 100,
    flag: 'flag{467605cfbcc845d1e50b1ccd1442df64}',
    hints: [
      { text_th: 'สังเกต pattern: ตัวอักษรผสมตัวเลข และลงท้ายด้วย ==', text_en: 'Notice the pattern: letters mixed with digits, ending with ==', penalty_pct: 0 },
      { text_th: 'ลงท้าย == บอกใบ้ว่าเป็น encoding อะไร? ลอง decode แล้วดูผลลัพธ์', text_en: 'The == ending hints at a specific encoding. Try decoding and inspect the result', penalty_pct: 25 },
      { text_th: 'ชั้นนอก: Base64 → ชั้นใน: Base32 (ใช้ตัวพิมพ์ใหญ่ A-Z และตัวเลข 2-7)', text_en: 'Outer layer: Base64 → Inner layer: Base32 (uppercase A-Z and digits 2-7)', penalty_pct: 50 },
    ],
    solution_th: 'Base64 → Base32 → flag{467605cfbcc845d1e50b1ccd1442df64}',
    writeup_th: 'ข้อนี้มี 2 ชั้น: Base64 ครอบ Base32\n\nวิธีสังเกต:\n• Base64: ใช้ A-Z, a-z, 0-9, +, / ลงท้าย = หรือ ==\n• Base32: ใช้แค่ A-Z ตัวพิมพ์ใหญ่ + ตัวเลข 2-7 ลงท้าย =\n\nเมื่อ decode Base64 แล้วได้ผลลัพธ์ที่ดูเหมือน Base32 (ตัวพิมพ์ใหญ่ทั้งหมด) ให้ decode ต่ออีกชั้น\n\nเครื่องมือ:\n• CyberChef → From Base64 → From Base32\n• python3: import base64; base64.b32decode(base64.b64decode("TVpX...")).decode()',
    writeup_en: 'This challenge has 2 layers: Base64 wrapping Base32\n\nHow to spot them:\n• Base64: uses A-Z, a-z, 0-9, +, / — ends with = or ==\n• Base32: uses only uppercase A-Z + digits 2-7 — ends with =\n\nAfter Base64 decode you get something that looks like Base32 (all uppercase). Decode again.\n\nTools:\n• CyberChef → From Base64 → From Base32\n• python3: import base64; base64.b32decode(base64.b64decode("TVpX...")).decode()',
    visible: true,
  },
  {
    title_th: 'อีโมจิพูดได้', title_en: 'Emoji Speaks',
    description_th: 'หน่วยข่าวกรองดักจับข้อความที่กลุ่มต้องสงสัยส่งถึงกัน — แต่มันเป็นแค่อีโมจิเรียงกัน ข้อความนี้ซ่อนอะไรไว้?\n\n🙆🙌🙁🙇🙛😓🙄🙆😖😒😗🙅🙆😙😔😙🙃😖😐😔😗🙅😙😓😗🙅😓🙄🙃😔🙁😑😑🙂😓🙆😑🙝',
    description_en: 'Intelligence intercepted a message a suspicious group was sending to each other — but it is just a row of emojis. What is hidden inside?\n\n🙆🙌🙁🙇🙛😓🙄🙆😖😒😗🙅🙆😙😔😙🙃😖😐😔😗🙅😙😓😗🙅😓🙄🙃😔🙁😑😑🙂😓🙆😑🙝',
    category: 'CRYPTO', difficulty: 'Medium', base_points: 300,
    flag: 'flag{3df627ef949c6047e937e3dc4a11b3f1}',
    hints: [
      { text_th: 'ตัวอักษรและสัญลักษณ์ทุกตัวในคอมพิวเตอร์มีเลขประจำตัว — emoji ก็เช่นกัน', text_en: 'Every character and symbol in a computer has a number — so do emojis', penalty_pct: 0 },
      { text_th: '😀 = Unicode U+1F600 = เลข 128512 ลองหาเลข Unicode ของแต่ละ emoji แล้วดูความสัมพันธ์กับ ASCII', text_en: '😀 = Unicode U+1F600 = number 128512. Find the Unicode number of each emoji and see the relationship to ASCII', penalty_pct: 25 },
      { text_th: 'offset = ord(emoji) - 0x1F600 → ASCII char = chr(offset + 32)', text_en: 'offset = ord(emoji) - 0x1F600 → ASCII char = chr(offset + 32)', penalty_pct: 50 },
    ],
    solution_th: "Unicode offset → ASCII → flag{3df627ef949c6047e937e3dc4a11b3f1}",
    writeup_th: 'emoji แต่ละตัวมี Unicode code point ที่ต่างกัน กลุ่ม 😀 (U+1F600) ถูก map ไปยัง ASCII โดย: offset = ord(emoji) - 0x1F600, char = chr(offset + 32)\n\nวิธีสังเกต: emoji ที่ใช้ทั้งหมดอยู่ในช่วง U+1F600-U+1F64F (Emoticons block)\n\nเครื่องมือ:\n• python3: "".join(chr(ord(e)-0x1F600+32) for e in emojis)\n• unicode-table.com (ตรวจ code point)\n• CyberChef → To Charcode → คำนวณ offset',
    writeup_en: 'Each emoji has a unique Unicode code point. The 😀 group (U+1F600) maps to ASCII via: offset = ord(emoji) - 0x1F600, char = chr(offset + 32)\n\nHow to spot it: All emojis are in range U+1F600-U+1F64F (Emoticons block)\n\nTools:\n• python3: "".join(chr(ord(e)-0x1F600+32) for e in emojis)\n• unicode-table.com (check code points)\n• CyberChef → To Charcode → calculate offset',
    visible: true,
  },
  {
    title_th: 'นักรบ XOR', title_en: 'XOR Warrior',
    description_th: 'ทีมรักษาความปลอดภัยดักจับ traffic ลึกลับจากเครือข่ายต้องสงสัย ข้อมูลที่ส่งออกมาผ่านการเข้ารหัสมาก่อน ถ้าถอดได้ก็จะรู้ว่ามีการส่งอะไรออกไป\n\n242e23253973237a7127202124717a26757a7b7a207a7a21277777722072727624777072763f',
    description_en: 'The security team intercepted mysterious traffic from a suspicious network. The data was encrypted before transmission. Can you decode it to find out what was sent?\n\n242e23253973237a7127202124717a26757a7b7a207a7a21277777722072727624777072763f',
    category: 'CRYPTO', difficulty: 'Hard', base_points: 500,
    flag: 'flag{1a83ebcf38d7898b88ce550b004f5204}',
    hints: [
      { text_th: 'ข้อมูลอยู่ในรูป Hexadecimal — ตัวอักษรมีแค่ 0-9 และ a-f แต่ละ 2 ตัว = 1 byte', text_en: 'Data is in Hexadecimal — only characters 0-9 and a-f, every 2 chars = 1 byte', penalty_pct: 0 },
      { text_th: 'การเข้ารหัสชนิดหนึ่งทำงานโดย XOR ทุก byte กับค่าคงที่ตัวเดียว — ลอง brute force ค่า 0x00 ถึง 0xFF', text_en: 'One encryption method XORs every byte with a single constant. Try brute forcing values 0x00 to 0xFF', penalty_pct: 25 },
      { text_th: 'flag ขึ้นต้นด้วย "flag{" — ใช้ตรวจสอบ key ที่ถูกต้อง: bytes(b ^ k for b in bytes.fromhex(data))', text_en: 'The flag starts with "flag{" — use this to verify the correct key: bytes(b ^ k for b in bytes.fromhex(data))', penalty_pct: 50 },
    ],
    solution_th: 'XOR key = 0x42 → flag{1a83ebcf38d7898b88ce550b004f5204}',
    writeup_th: 'XOR Cipher เข้ารหัสโดย XOR ทุก byte กับ key ตัวเดียว ถอดรหัสได้ด้วยวิธีเดียวกัน (XOR ซ้ำ)\n\nKey ของข้อนี้คือ 0x42\nวิธี brute force: for k in range(256): result = bytes(b^k for b in bytes.fromhex(data)); if result.startswith(b"flag{"): print(k, result)\n\nวิธีสังเกต: ข้อมูล hex ที่ดูเหมือน noise — ไม่มี pattern อ่านได้\n\nเครื่องมือ:\n• python3 (brute force loop)\n• CyberChef → XOR Brute Force\n• dcode.fr → XOR Cipher',
    writeup_en: 'XOR Cipher encrypts by XOR-ing every byte with a single key. Decryption is identical (XOR again).\n\nThe key for this challenge is 0x42\nBrute force method: for k in range(256): result = bytes(b^k for b in bytes.fromhex(data)); if result.startswith(b"flag{"): print(k, result)\n\nHow to spot it: Hex data that looks like random noise with no readable pattern\n\nTools:\n• python3 (brute force loop)\n• CyberChef → XOR Brute Force\n• dcode.fr → XOR Cipher',
    visible: true,
  },
  // ── MISC ──
  {
    title_th: 'มอร์สในความมืด', title_en: 'Morse in the Dark',
    description_th: 'ขณะลาดตระเวนในป่า ทีมได้รับสัญญาณแปลกๆ จากวิทยุ — เสียงสั้นและยาวสลับกัน บันทึกไว้ได้ดังนี้:\n\n. .---- . -... -.-. ---.. ..--- ..... -.... -.... ----- --... --... -... ..... ....- ...-- -.. ----- -.. ..... -.. . .- ....- ..... ---.. ....- ----. -.. -.... -...',
    description_en: 'While patrolling the forest, the team received a strange signal on the radio — short and long sounds alternating. It was recorded as follows:\n\n. .---- . -... -.-. ---.. ..--- ..... -.... -.... ----- --... --... -... ..... ....- ...-- -.. ----- -.. ..... -.. . .- ....- ..... ---.. ....- ----. -.. -.... -...',
    category: 'MISC', difficulty: 'Easy', base_points: 100,
    flag: 'flag{e1ebc82566077b543d0d5dea45849d6b}',
    hints: [
      { text_th: 'เสียงสั้น . กับเสียงยาว - สลับกัน — รหัสสื่อสารโบราณชนิดนี้มีมาตั้งแต่ยุค telegraph', text_en: 'Short . and long - sounds alternating — this ancient communication code has been around since the telegraph era', penalty_pct: 0 },
      { text_th: 'รหัส Morse: . = dot, - = dash, ช่องว่าง = คั่นตัวอักษร ช่องว่าง 3 ช่อง = คั่นคำ', text_en: 'Morse code: . = dot, - = dash, space = letter separator, 3 spaces = word separator', penalty_pct: 25 },
      { text_th: 'เครื่องมือ: dcode.fr/en/morse-code หรือ morsecode.world', text_en: 'Tools: dcode.fr/en/morse-code or morsecode.world', penalty_pct: 50 },
    ],
    solution_th: 'Morse decode → e1ebc82566077b543d0d5dea45849d6b → ใส่ใน flag{...}',
    writeup_th: 'Morse Code คือระบบสัญญาณที่ใช้ . (dot/สั้น) และ - (dash/ยาว) แทนตัวอักษรและตัวเลข\n\nวิธีสังเกต: มีแค่ . และ - สลับกัน คั่นด้วยช่องว่าง\n\nเครื่องมือ:\n• dcode.fr/en/morse-code\n• morsecode.world\n• CyberChef → From Morse Code\n\nสำหรับข้อนี้: ผลลัพธ์คือ hex string → ใส่ใน flag{...}',
    writeup_en: 'Morse Code is a signaling system using . (dot/short) and - (dash/long) to represent letters and numbers.\n\nHow to spot it: Only dots and dashes, separated by spaces\n\nTools:\n• dcode.fr/en/morse-code\n• morsecode.world\n• CyberChef → From Morse Code\n\nFor this challenge: the result is a hex string → wrap in flag{...}',
    visible: true,
  },
  {
    title_th: 'ปฏิกิริยาลูกโซ่', title_en: 'Chain Reaction',
    description_th: 'ข้อมูลชิ้นนี้ผ่านมือมาหลายทอด — ถูกซ่อนซ้อนกันมากกว่า 1 วิธี ต้องถอดออกทีละขั้นตอน ขั้นสุดท้ายอาจต้องคิดนอกกรอบ\n\nfTEzYWIyODExMTJmMDAxYWFhZDBjMWNmM2RlNjhlNWI2e2dhbGY=',
    description_en: 'This data has passed through many hands — hidden in more than one way. You must unpack it step by step. The final step might require thinking outside the box.\n\nfTEzYWIyODExMTJmMDAxYWFhZDBjMWNmM2RlNjhlNWI2e2dhbGY=',
    category: 'MISC', difficulty: 'Medium', base_points: 300,
    flag: 'flag{6b5e86ed3fc1c0daaa100f211182ba31}',
    hints: [
      { text_th: 'สังเกต pattern ตัวอักษร — ลงท้าย = บอกอะไรได้บ้าง?', text_en: 'Notice the character pattern — what does the trailing = suggest?', penalty_pct: 0 },
      { text_th: 'ลอง decode ชั้นแรกดู แล้วอ่านผลลัพธ์อย่างดี มีอะไรที่แปลกอยู่ไหม?', text_en: 'Try decoding the first layer and read the result carefully. Does anything look odd?', penalty_pct: 25 },
      { text_th: 'หลัง decode แล้ว ลองอ่านผลลัพธ์จากหลังไปหน้า', text_en: 'After decoding, try reading the result backwards', penalty_pct: 50 },
    ],
    solution_th: 'Base64 decode → reverse string → flag{6b5e86ed3fc1c0daaa100f211182ba31}',
    writeup_th: 'ข้อนี้มี 2 ขั้นตอน: Base64 decode แล้วกลับข้อความ\n\nหลัง decode Base64 จะได้: }13ab2811001c0daaa100f211182ba31{galF\nซึ่งคือ flag{6b5e86ed3fc1c0daaa100f211182ba31} ที่กลับหน้าหลัง\n\nวิธีสังเกต: ลงท้าย = → Base64, ผลลัพธ์ดูเหมือน flag ที่กลับด้าน\n\nเครื่องมือ:\n• python3: base64.b64decode("fTEz...").decode()[::-1]\n• CyberChef → From Base64 → Reverse',
    writeup_en: 'This challenge has 2 steps: Base64 decode then reverse the string\n\nAfter Base64 decode you get: }13ab2811001c0daaa100f211182ba31{galF\nWhich is flag{6b5e86ed3fc1c0daaa100f211182ba31} reversed\n\nHow to spot it: ends with = → Base64, result looks like a reversed flag\n\nTools:\n• python3: base64.b64decode("fTEz...").decode()[::-1]\n• CyberChef → From Base64 → Reverse',
    visible: true,
  },
  // ── FOR ──
  {
    title_th: 'ซ่อนในภาพ', title_en: 'Hidden in Plain Sight',
    description_th: 'เพื่อนส่งรูปถ่ายมาให้ดู ดูภายนอกธรรมดาทุกอย่าง แต่มีบางสิ่งที่มองด้วยตาเปล่าไม่เห็น — รูปนี้ซ่อนอะไรไว้?',
    description_en: 'A friend sent you a photo. It looks completely ordinary. But something is hidden that cannot be seen by the naked eye — what is this image hiding?',
    category: 'FOR', difficulty: 'Easy', base_points: 100,
    flag: 'flag{bef449197a983758d49a626bd3bef897}',
    attachment_url: '/challenges/hidden-metadata.jpg',
    hints: [
      { text_th: 'ไฟล์ไม่ได้มีแค่ข้อมูลที่มองเห็น — อาจมีข้อมูลอื่นซ่อนอยู่ด้วย', text_en: 'Files contain more than just visible data — there may be other hidden information', penalty_pct: 0 },
      { text_th: 'ไฟล์รูปมักบันทึก EXIF metadata: กล้อง, วันที่, GPS และ... field อื่นๆ', text_en: 'Image files often store EXIF metadata: camera, date, GPS, and... other fields', penalty_pct: 25 },
      { text_th: 'ใช้ exiftool: exiftool hidden-metadata.jpg → ดูทุก field โดยเฉพาะ User Comment', text_en: 'Use exiftool: exiftool hidden-metadata.jpg → look at all fields, especially User Comment', penalty_pct: 50 },
    ],
    solution_th: 'exiftool → User Comment → flag{bef449197a983758d49a626bd3bef897}',
    writeup_th: 'EXIF (Exchangeable Image File Format) คือ metadata ที่ฝังอยู่ในไฟล์รูปภาพ บันทึกข้อมูลเช่น กล้องที่ใช้ถ่าย, วันเวลา, GPS coordinates, และ fields อื่นๆ ที่กำหนดเองได้\n\nวิธีสังเกต: ดูด้วยตาเปล่าไม่ได้ ต้องใช้เครื่องมือ\n\nเครื่องมือ:\n• exiftool (command line): exiftool image.jpg\n• exif.tools (online)\n• Jeffrey\'s Exif Viewer (online)\n• python3: piexif.load("image.jpg")',
    writeup_en: 'EXIF (Exchangeable Image File Format) is metadata embedded in image files. It records info like camera model, date/time, GPS coordinates, and custom fields.\n\nHow to spot it: Cannot be seen visually — requires tools\n\nTools:\n• exiftool (command line): exiftool image.jpg\n• exif.tools (online)\n• Jeffrey\'s Exif Viewer (online)\n• python3: piexif.load("image.jpg")',
    visible: true,
  },
  {
    title_th: 'ไฟล์ปลอมตัว', title_en: 'File Disguise',
    description_th: 'เพื่อนส่งไฟล์ "รูปวันหยุด" มาให้ดู แต่โปรแกรมดูรูปทุกตัวไม่ยอมเปิด มันดูแปลกๆ บางทีมันอาจไม่ใช่รูปก็ได้',
    description_en: "A friend sent you their 'vacation photo' but every image viewer refuses to open it. Something seems off. Maybe it is not actually a photo.",
    category: 'FOR', difficulty: 'Medium', base_points: 300,
    flag: 'flag{28baa517161a68dae9111310ae1099cb}',
    attachment_url: '/challenges/photo_vacation.jpg',
    hints: [
      { text_th: 'นามสกุลไฟล์เปลี่ยนได้ง่ายๆ ตัวตนที่แท้จริงอยู่ที่ byte แรกๆ ของไฟล์ เรียกว่า "magic bytes"', text_en: 'File extensions can be changed easily. The true identity lies in the first bytes of the file — called "magic bytes"', penalty_pct: 0 },
      { text_th: 'ลอง command: file photo_vacation.jpg — จะบอกชนิดไฟล์ที่แท้จริงจาก magic bytes', text_en: 'Try: file photo_vacation.jpg — it identifies the real file type from magic bytes', penalty_pct: 25 },
      { text_th: 'magic bytes PK (0x50 0x4B) = ZIP archive — ลอง: unzip photo_vacation.jpg', text_en: 'magic bytes PK (0x50 0x4B) = ZIP archive — try: unzip photo_vacation.jpg', penalty_pct: 50 },
    ],
    solution_th: 'file → ZIP archive → unzip → cat flag.txt → flag{28baa517161a68dae9111310ae1099cb}',
    writeup_th: 'Magic bytes คือ signature bytes ตอนต้นของไฟล์ที่บอกชนิดจริงของไฟล์ ไม่ว่านามสกุลจะเป็นอะไร\n\nMagic bytes ที่รู้จักกันดี:\n• ZIP: PK (50 4B 03 04)\n• JPEG: FF D8 FF\n• PNG: 89 50 4E 47\n• PDF: 25 50 44 46\n\nวิธีสังเกต: ไฟล์เปิดไม่ได้ด้วยโปรแกรมตามนามสกุล\n\nเครื่องมือ:\n• command: file filename\n• hex editor: xxd / HxD / hexfiend\n• python3: open("file","rb").read(4)',
    writeup_en: 'Magic bytes are signature bytes at the start of a file that reveal its true type, regardless of the extension.\n\nCommon magic bytes:\n• ZIP: PK (50 4B 03 04)\n• JPEG: FF D8 FF\n• PNG: 89 50 4E 47\n• PDF: 25 50 44 46\n\nHow to spot it: File cannot be opened by the program matching its extension\n\nTools:\n• command: file filename\n• hex editor: xxd / HxD / hexfiend\n• python3: open("file","rb").read(4)',
    visible: true,
  },
  // ── WEB ──
  {
    title_th: 'คุกกี้มอนสเตอร์', title_en: 'Cookie Monster',
    description_th: 'เว็บไซต์นี้มีของขวัญซ่อนไว้สำหรับผู้มาเยือน แวะเยี่ยมที่ /api/challenge/cookie?locale=th แล้วลองหาดูว่ามันเก็บอะไรไว้ให้คุณบ้าง 🍪',
    description_en: 'This website has a gift hidden for visitors. Visit /api/challenge/cookie?locale=en and try to find what it has stored for you 🍪',
    category: 'WEB', difficulty: 'Easy', base_points: 100,
    flag: 'flag{b13ed3441e10af450d63360a5e6f1b82}',
    hints: [
      { text_th: 'เว็บไซต์มักเก็บข้อมูลขนาดเล็กไว้ในเบราว์เซอร์ เปิด F12 แล้วลองหาดูในส่วนที่เก็บข้อมูล', text_en: 'Websites often store small pieces of data in your browser. Open F12 and look in the storage section', penalty_pct: 0 },
      { text_th: 'F12 → Application → Cookies → หาค่าที่ดูแปลกๆ', text_en: 'F12 → Application → Cookies → find a value that looks unusual', penalty_pct: 25 },
      { text_th: 'ค่าที่เห็นดูคล้าย Base64 ไหม? ลอง decode ดู', text_en: 'Does the value look like Base64? Try decoding it', penalty_pct: 50 },
    ],
    solution_th: 'session_token cookie → Base64 decode → flag{b13ed3441e10af450d63360a5e6f1b82}',
    writeup_th: 'HTTP Cookie คือข้อมูลขนาดเล็กที่เว็บ server ส่งมาให้เบราว์เซอร์เก็บไว้ แล้วเบราว์เซอร์จะส่งกลับในทุก request\n\nข้อนี้: เมื่อเข้า /api/challenge/cookie server จะ set cookie ชื่อ session_token ที่มีค่าเป็น Base64 ของ flag\n\nวิธีดู Cookie:\n• F12 → Application → Storage → Cookies\n• F12 → Network → ดูใน Response Headers\n\nเครื่องมือ:\n• Browser DevTools\n• curl -c cookies.txt URL && cat cookies.txt',
    writeup_en: 'HTTP Cookies are small pieces of data that a web server sends to the browser to store, and the browser sends back on every request.\n\nThis challenge: Visiting /api/challenge/cookie sets a cookie named session_token with a Base64-encoded flag as its value.\n\nHow to view cookies:\n• F12 → Application → Storage → Cookies\n• F12 → Network → inspect Response Headers\n\nTools:\n• Browser DevTools\n• curl -c cookies.txt URL && cat cookies.txt',
    visible: true,
  },
  {
    title_th: 'หุ่นยนต์บอกทาง', title_en: 'The Robot Knows',
    description_th: 'เว็บไซต์นี้ดูน่าสงสัย — เจ้าของซ่อนบางส่วนไว้ไม่อยากให้ใครเจอ นักสืบที่ดีรู้ว่าต้องไปหาจากที่ไหน',
    description_en: 'This website looks suspicious — the owner has hidden something and does not want anyone to find it. A good investigator knows where to look first.',
    category: 'WEB', difficulty: 'Medium', base_points: 300,
    flag: 'flag{d4078fd0f999e68088896142089c4baf}',
    hints: [
      { text_th: 'เว็บไซต์มีไฟล์พิเศษที่บอก Search Engine ว่าอย่าเข้า path ไหน — เจ้าของมักลืมว่านักสืบก็เข้าได้', text_en: 'Websites have a special file telling Search Engines which paths to avoid — owners often forget that investigators can visit those too', penalty_pct: 0 },
      { text_th: 'ลองเข้า /robots.txt ของเว็บนี้', text_en: 'Try visiting /robots.txt of this website', penalty_pct: 25 },
      { text_th: 'ดู Disallow: paths แล้วเข้าดู URL นั้นตรงๆ ด้วยเบราว์เซอร์', text_en: 'Look at the Disallow: paths and visit those URLs directly with your browser', penalty_pct: 50 },
    ],
    solution_th: '/robots.txt → Disallow path → เข้าตรงๆ → flag{d4078fd0f999e68088896142089c4baf}',
    writeup_th: 'robots.txt เป็นไฟล์มาตรฐานที่เว็บ owner ใช้บอก web crawler / search engine ว่าไม่ให้ index path ไหน แต่ไม่ได้กันคนจริงๆ ออก!\n\nรูปแบบ robots.txt:\nUser-agent: *\nDisallow: /secret-path/\n\nนักสืบใช้ดูเป็น reconnaissance step แรกๆ\n\nเครื่องมือ:\n• Browser: เข้า yoursite.com/robots.txt ตรงๆ\n• curl https://site.com/robots.txt',
    writeup_en: 'robots.txt is a standard file that website owners use to tell web crawlers / search engines which paths not to index. But it does NOT block real people!\n\nrobots.txt format:\nUser-agent: *\nDisallow: /secret-path/\n\nInvestigators use it as an early reconnaissance step.\n\nTools:\n• Browser: visit yoursite.com/robots.txt directly\n• curl https://site.com/robots.txt',
    visible: true,
  },
]

// Patches — full rewrite of descriptions, hints, writeups for existing Firestore docs
const PATCHES = CHALLENGES.map(ch => ({
  title_en: ch.title_en,
  title_th: ch.title_th,
  description_th: ch.description_th,
  description_en: ch.description_en,
  hints: ch.hints,
  solution_th: ch.solution_th,
  writeup_th: ch.writeup_th,
  writeup_en: ch.writeup_en,
}))

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

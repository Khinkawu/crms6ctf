import { NextRequest, NextResponse } from 'next/server'
import CryptoJS from 'crypto-js'

// ECB Oracle Challenge
// The flag is appended to the user input and then encrypted using AES-128-ECB.
// The user controls the prefix length to align blocks and extract the flag byte-by-byte.

const SECRET_KEY = CryptoJS.enc.Utf8.parse('s3cr3t_k3y_16byt') // 16 bytes
const FLAG = 'flag{3cb_p3ngu1n_4tt4ck5_4g41n}'

export async function POST(req: NextRequest) {
  try {
    const { plaintext } = await req.json()
    
    if (typeof plaintext !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid plaintext' }, { status: 400 })
    }

    // data = userInput + unknownFlag
    const dataToEncrypt = plaintext + FLAG
    
    const encrypted = CryptoJS.AES.encrypt(dataToEncrypt, SECRET_KEY, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7
    })

    return NextResponse.json({
      ciphertext_hex: encrypted.ciphertext.toString(CryptoJS.enc.Hex)
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

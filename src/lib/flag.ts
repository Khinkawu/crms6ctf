export async function hashFlag(flag: string): Promise<string> {
  const normalized = flag.trim().toLowerCase()
  const encoder = new TextEncoder()
  const data = encoder.encode(normalized)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export function normalizeFlag(input: string): string {
  return input.trim().toLowerCase()
}

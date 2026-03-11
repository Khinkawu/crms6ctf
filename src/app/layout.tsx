import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CRMS6 CTF',
  description: 'CTF Platform for Tessaban 6 Nakhon Chiang Rai',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children
}

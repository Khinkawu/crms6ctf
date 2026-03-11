import { NextIntlClientProvider, useMessages } from 'next-intl'
import { notFound } from 'next/navigation'
import { AuthProvider } from '@/hooks/useAuth'
import Navbar from '@/components/Navbar'
import { Geist_Mono } from 'next/font/google'
import '../globals.css'

const mono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono' })
const locales = ['th', 'en']

export default function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  if (!locales.includes(locale)) notFound()
  const messages = useMessages()

  return (
    <html lang={locale} className="dark">
      <body className={`${mono.variable} font-mono bg-gray-950 text-gray-100 min-h-screen`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AuthProvider>
            <Navbar />
            <main className="container mx-auto px-4 py-6 max-w-6xl">
              {children}
            </main>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}

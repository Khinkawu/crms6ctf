import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { AuthProvider } from '@/hooks/useAuth'
import Navbar from '@/components/Navbar'
import { Geist_Mono } from 'next/font/google'
import '../globals.css'

const mono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono' })
const locales = ['th', 'en']

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!locales.includes(locale)) notFound()
  const messages = await getMessages({ locale })

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

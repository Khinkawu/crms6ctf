import createMiddleware from 'next-intl/middleware'

export default createMiddleware({
  locales: ['th', 'en'],
  defaultLocale: 'th',
  localePrefix: 'always',
})

export const config = {
  matcher: ['/((?!api|_next|_vercel|secret-vault-7f3a9d|secret-archive-c9f2e1|.*\\..*).*)'],
}

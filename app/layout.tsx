import type { Metadata, Viewport } from 'next'
import { Noto_Sans_JP } from 'next/font/google'
import './globals.css'
import 'react-tweet/theme.css'
import Link from 'next/link'

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
  variable: '--font-noto-sans-jp',
})

export const metadata: Metadata = {
  title: 'MEMOTTO',
  description: 'AIによるシンプルなメモ管理アプリ',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MEMOTTO',
  },
}

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja" className={notoSansJP.variable}>
      <body className="antialiased font-sans flex flex-col min-h-screen">
        <main className="flex-grow">{children}</main>
        <footer className="bg-gray-800 text-white p-4 text-center text-sm">
          <div className="container mx-auto">
            <Link href="/privacy" className="hover:underline mx-2">プライバシーポリシー</Link>
            <span className="mx-2">|</span>
            <Link href="/terms-of-service" className="hover:underline mx-2">利用規約</Link>
            <p className="mt-2">&copy; {new Date().getFullYear()} MEMOTTO. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  )
}


import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '0lirab Food',
  description: 'Fast food management system',
  generator: 'Ossama Blt',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/1.png" sizes="180x180" />
      </head>
      <body className="bg-gray-100 text-gray-900 flex flex-col min-h-screen">
        <main className="flex-1">{children}</main>
      </body>
    </html>
  )
}

import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { WalletContextProvider } from "@/components/WalletContextProvider"
import { Toaster } from "sonner"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Sol Vault | Solana DeFi",
  description: "Deposit SOL, earn reward tokens. A production-grade DeFi vault on Solana.",
  generator: "v0.app",
  icons: {
    icon: "/solvault.jpg",
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
      <WalletContextProvider>
        {children}
        <Toaster 
          position="top-center"
          toastOptions={{
            style: {
              marginTop: "20px",
              borderRadius: "0.5rem",
            },
          }}
        />
        <Analytics />
      </WalletContextProvider>
      </body>
    </html>
  )
}

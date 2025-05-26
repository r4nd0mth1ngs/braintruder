import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { PentestProvider } from "@/contexts/pentest-context"
import { ToolsProvider } from "@/contexts/tools-context"
import { ConnectionProvider } from "@/contexts/connection-context"
import { ReportProvider } from "@/contexts/report-context"
import { AIProvider } from "@/contexts/ai-context"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Braintruder - AI Driven Autonomous Penetration Testing Platform",
  description: "Advanced AI-powered penetration testing platform for autonomous security assessments",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <ConnectionProvider>
            <ToolsProvider>
              <AIProvider>
                <PentestProvider>
                  <ReportProvider>
                    {children}
                    <Toaster />
                  </ReportProvider>
                </PentestProvider>
              </AIProvider>
            </ToolsProvider>
          </ConnectionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

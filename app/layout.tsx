import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { ChatProvider } from "@/contexts/chat-context"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { ErrorBoundary } from "@/components/error-boundary"
import ConditionalLayout from "@/components/conditional-layout"
import { GlobalAudioProvider } from "@/components/global-audio-provider"


const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "WaveStream Radio",
  description: "Your premier destination for podcasts, audiobooks, and live broadcasts",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ErrorBoundary>
            <AuthProvider>
              <ChatProvider>
                <GlobalAudioProvider>
                  <ConditionalLayout>
                    {children}
                  </ConditionalLayout>
                </GlobalAudioProvider>
                <Toaster />
                <SonnerToaster position="top-right" />
              </ChatProvider>
            </AuthProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}



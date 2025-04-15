"use client"

import { ThemeProvider } from "@/components/theme-provider"

export default function ClientThemeProvider({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      {children}
    </ThemeProvider>
  )
} 
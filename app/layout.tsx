import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { getSession } from '@/lib/auth'
import Link from 'next/link'
import ClientThemeProvider from '@/components/client-theme-provider'
import { MobileNav } from '@/components/ui/mobile-nav'
import { PageLoadingBar } from '@/components/ui/loading'

export const metadata: Metadata = {
  title: 'Aplicativo Católico - Catequese & Quiz',
  description: 'Plataforma para catequistas e catequisandos com quiz interativo e recursos para ensino da fé católica.',
}

// Importando fontes especiais para o tema católico
import { Cinzel, Montserrat } from 'next/font/google'

const cinzel = Cinzel({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-cinzel',
  weight: ['400', '500', '600', '700']
})

const montserrat = Montserrat({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-montserrat',
  weight: ['300', '400', '500', '600', '700']
})

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  const isLoggedIn = !!session?.user?.id
  const userRole = session?.user?.role || null

  return (
    <ClerkProvider>
      <html lang="pt-BR" className={`${cinzel.variable} ${montserrat.variable}`} suppressHydrationWarning>
        <body className="min-h-screen bg-background font-sans antialiased">
          <ClientThemeProvider>
            {/* Barra de carregamento de página */}
            <PageLoadingBar />
            
            <main className="flex min-h-screen flex-col md:flex-row">
              {isLoggedIn && (
                <>
                  {/* Sidebar para desktop */}
                  <aside className="hidden md:flex flex-col w-64 md:min-h-screen bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))] border-r border-[hsl(var(--sidebar-border))] z-50">
                    <div className="flex flex-col h-full">
                      <div className="p-4 border-b border-[hsl(var(--sidebar-border))]">
                        <div className="flex items-center justify-center md:justify-start gap-3">
                          <div className="relative w-10 h-10 holy-glow">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10">
                              <path d="M12 2L14.85 8.3L22 9.3L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.3L9.15 8.3L12 2Z" 
                                    fill="hsl(var(--accent))" 
                                    stroke="hsl(var(--accent-foreground))" 
                                    strokeWidth="0.5"/>
                            </svg>
                          </div>
                          <h1 className="text-xl font-bold font-cinzel text-[hsl(var(--sidebar-primary))]">
                            Catequese App
                          </h1>
                        </div>
                      </div>
                      
                      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
                        <Link href="/dashboard" className="flex items-center px-4 py-3 rounded-lg hover:bg-[hsl(var(--sidebar-accent))] transition-colors duration-200 group">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-[hsl(var(--sidebar-primary))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                          <span className="font-medium">Dashboard</span>
                        </Link>
                        
                        {/* Menu Catequistas - Apenas para Admin */}
                        {userRole === "admin" && (
                          <Link href="/catequistas" className="flex items-center px-4 py-3 rounded-lg hover:bg-[hsl(var(--sidebar-accent))] transition-colors duration-200 group">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-[hsl(var(--sidebar-primary))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            <span className="font-medium">Catequistas</span>
                          </Link>
                        )}
                        
                        {/* Menu Catequisandos - Apenas para Catequistas */}
                        {userRole === "catequista" && (
                          <Link href="/catequisandos" className="flex items-center px-4 py-3 rounded-lg hover:bg-[hsl(var(--sidebar-accent))] transition-colors duration-200 group">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-[hsl(var(--sidebar-primary))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <span className="font-medium">Catequisandos</span>
                          </Link>
                        )}
                        
                        <Link href="/quizzes" className="flex items-center px-4 py-3 rounded-lg hover:bg-[hsl(var(--sidebar-accent))] transition-colors duration-200 group">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-[hsl(var(--sidebar-primary))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium">Quizzes</span>
                        </Link>
                        
                        {/* Ranking - Disponível para todos */}
                        <Link href="/ranking" className="flex items-center px-4 py-3 rounded-lg hover:bg-[hsl(var(--sidebar-accent))] transition-colors duration-200 group">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-[hsl(var(--sidebar-primary))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          <span className="font-medium">Ranking</span>
                        </Link>
                        
                        <Link href="/profile" className="flex items-center px-4 py-3 rounded-lg hover:bg-[hsl(var(--sidebar-accent))] transition-colors duration-200 group">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-[hsl(var(--sidebar-primary))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="font-medium">Perfil</span>
                        </Link>
                      </nav>
                      
                      <div className="p-4 border-t border-[hsl(var(--sidebar-border))]">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-[hsl(var(--sidebar-primary))] flex items-center justify-center text-[hsl(var(--sidebar-primary-foreground))] font-bold">
                              {session?.user?.nome?.charAt(0) || "U"}
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium">{session?.user?.nome || "Usuário"}</p>
                              <p className="text-xs text-[hsl(var(--sidebar-foreground))/70]">{session?.parishId ? "Paróquia" : "Sem paróquia"}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </aside>
                  
                  {/* Navegação mobile */}
                  <MobileNav userRole={userRole} />
                </>
              )}
              
              <div className="flex-1 pb-20 md:pb-0">
                <div className="animate-fade-in">
                  {children}
                </div>
              </div>
            </main>
          </ClientThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}


"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { 
  Home, 
  Users, 
  BookOpen, 
  Award, 
  User,
  Menu,
  X,
  LogOut
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

type MobileNavProps = {
  userRole?: string | null
}

export function MobileNav({ userRole }: MobileNavProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  
  // Fecha o menu ao navegar
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])
  
  // Evita scroll quando menu está aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }
    
    return () => {
      document.body.style.overflow = "auto"
    }
  }, [isOpen])
  
  // Links principais para a barra inferior
  const mainLinks = [
    {
      href: "/dashboard",
      label: "Início",
      icon: <Home className="h-5 w-5" />,
      roles: ["admin", "catequista", "catequisando"]
    },
    {
      href: "/quizzes",
      label: "Quizzes",
      icon: <BookOpen className="h-5 w-5" />,
      roles: ["admin", "catequista", "catequisando"]
    },
    {
      href: userRole === "admin" ? "/catequistas" : "/catequisandos",
      label: userRole === "admin" ? "Catequistas" : "Catequisandos",
      icon: <Users className="h-5 w-5" />,
      roles: ["admin", "catequista"]
    },
    {
      href: "/ranking",
      label: "Ranking",
      icon: <Award className="h-5 w-5" />,
      roles: ["admin", "catequista", "catequisando"]
    },
    {
      href: "/profile",
      label: "Perfil",
      icon: <User className="h-5 w-5" />,
      roles: ["admin", "catequista", "catequisando"]
    }
  ]
  
  // Filtra os links com base no papel do usuário
  const filteredLinks = userRole 
    ? mainLinks.filter(link => link.roles.includes(userRole))
    : mainLinks.filter(link => link.roles.includes("catequisando"))
  
  return (
    <>
      {/* Barra inferior fixa */}
      <nav className="mobile-nav md:hidden">
        {filteredLinks.slice(0, 4).map(link => (
          <Link 
            key={link.href} 
            href={link.href}
            className={`mobile-nav-item ${pathname === link.href ? "active" : ""}`}
          >
            {pathname === link.href && (
              <motion.div
                layoutId="active-pill"
                className="absolute top-0 left-0 right-0 bottom-0 bg-primary/10 rounded-lg -z-10"
                transition={{ type: "spring", duration: 0.6 }}
              />
            )}
            <span className={pathname === link.href ? "text-primary" : "text-muted-foreground"}>
              {link.icon}
            </span>
            <span className={`text-xs mt-1 ${pathname === link.href ? "font-medium text-primary" : "text-muted-foreground"}`}>
              {link.label}
            </span>
          </Link>
        ))}
        
        <button 
          onClick={() => setIsOpen(true)}
          className="mobile-nav-item"
        >
          <span className="text-muted-foreground">
            <Menu className="h-5 w-5" />
          </span>
          <span className="text-xs mt-1 text-muted-foreground">
            Menu
          </span>
        </button>
      </nav>
      
      {/* Sidebar de menu completo */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="sidebar-overlay"
              onClick={() => setIsOpen(false)}
            />
            
            <motion.div
              className="sidebar-wrapper"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div className="sidebar-content">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative w-8 h-8 holy-glow">
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
                        <path d="M12 2L14.85 8.3L22 9.3L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.3L9.15 8.3L12 2Z" 
                              fill="hsl(var(--accent))" 
                              stroke="hsl(var(--accent-foreground))" 
                              strokeWidth="0.5"/>
                      </svg>
                    </div>
                    <h1 className="text-xl font-bold font-cinzel text-primary">
                      Catequese App
                    </h1>
                  </div>
                  
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-lg hover:bg-muted"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="p-2">
                  {mainLinks.map(link => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center p-3 rounded-lg mb-1 ${
                        pathname === link.href ? "bg-primary/10 text-primary" : "hover:bg-muted/50"
                      }`}
                    >
                      <span className="mr-3">{link.icon}</span>
                      <span className="font-medium">{link.label}</span>
                    </Link>
                  ))}
                </div>
                
                <div className="border-t border-border p-4 mt-auto">
                  <Link
                    href="/logout"
                    className="flex items-center p-3 rounded-lg text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="h-5 w-5 mr-3" />
                    <span className="font-medium">Sair</span>
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
} 
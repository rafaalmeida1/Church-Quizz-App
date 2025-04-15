"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

type Notification = {
  id: string
  type: string
  message: string
  quizId?: string
  quizTitle?: string
  timestamp: number
  read: boolean
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  const fetchNotifications = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/notifications", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()
      
      if (data.success) {
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error("Erro ao buscar notificações:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notificationId }),
      })

      const data = await response.json()
      
      if (data.success) {
        // Atualiza localmente o status da notificação
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId ? { ...notif, read: true } : notif
          )
        )
      }
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error)
    }
  }

  const navigateToQuiz = (quizId: string) => {
    router.push(`/quizzes/${quizId}`)
  }

  useEffect(() => {
    fetchNotifications()
    
    // Atualiza as notificações a cada 30 segundos
    const interval = setInterval(fetchNotifications, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notificações</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {isLoading ? (
          <div className="p-4 text-center text-muted-foreground">
            Carregando...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            Nenhuma notificação
          </div>
        ) : (
          <DropdownMenuGroup className="max-h-[400px] overflow-y-auto">
            {notifications.map((notification, index) => (
              <DropdownMenuItem 
                key={index}
                className={`p-3 cursor-pointer ${notification.read ? 'opacity-70' : 'font-medium'}`}
                onClick={() => {
                  if (notification.quizId) {
                    navigateToQuiz(notification.quizId)
                  }
                  // Marcar como lido se ainda não estiver
                  if (!notification.read && notification.id) {
                    markAsRead(notification.id)
                  }
                }}
              >
                <div className="flex flex-col gap-1 w-full">
                  <div className="flex items-start justify-between">
                    <span className={`text-sm ${notification.type === 'quiz_error' ? 'text-destructive' : 'text-primary'}`}>
                      {notification.type === 'quiz_error' ? 'Erro em Quiz' : 'Quiz Pronto'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.timestamp), { locale: ptBR, addSuffix: true })}
                    </span>
                  </div>
                  
                  <p className="text-sm">{notification.message}</p>
                  
                  {notification.quizTitle && (
                    <div className="text-xs bg-muted rounded px-2 py-1 mt-1 text-muted-foreground">
                      Quiz: {notification.quizTitle}
                    </div>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 
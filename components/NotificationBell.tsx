"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Spinner } from "@/components/ui/loading"

interface Notification {
  id: string
  type: string
  message: string
  timestamp: number
  read: boolean
  quizId?: string
}

export default function NotificationBell({ userId }: { userId?: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  
  const unreadCount = notifications.filter(n => !n.read).length
  
  // Fetch notifications when component mounts or popover opens
  useEffect(() => {
    if (open) {
      fetchNotifications()
    }
  }, [open])
  
  async function fetchNotifications() {
    try {
      setLoading(true)
      const response = await fetch('/api/notifications')
      
      if (!response.ok) {
        throw new Error('Falha ao buscar notificações')
      }
      
      const data = await response.json()
      
      if (data.success) {
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error('Erro ao buscar notificações:', error)
    } finally {
      setLoading(false)
    }
  }
  
  async function markAsRead(notificationId: string) {
    try {
      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationId }),
      })
      
      if (response.ok) {
        // Update the local state
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, read: true } 
              : notif
          )
        )
      }
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error)
    }
  }
  
  function formatTimestamp(timestamp: number) {
    const date = new Date(timestamp)
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="px-4 py-3 font-semibold text-sm border-b">
          Notificações
        </div>
        <ScrollArea className="h-80">
          {loading ? (
            <div className="flex items-center justify-center h-24">
              <Spinner />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Nenhuma notificação
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map(notification => (
                <div 
                  key={notification.id} 
                  className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${notification.read ? 'opacity-70' : 'bg-muted/10'}`}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    {notification.type === 'quiz_error' && (
                      <div className="bg-red-100 rounded-full p-2 mt-1">
                        <Bell className="h-4 w-4 text-red-500" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <div className="font-medium text-sm">
                          {notification.type === 'quiz_error' ? 'Erro no Quiz' : 'Notificação'}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {formatTimestamp(notification.timestamp)}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {notification.message}
                      </p>
                      {notification.quizId && (
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="px-0 h-auto text-xs text-primary mt-1"
                          asChild
                        >
                          <a href={`/quizzes/${notification.quizId}`}>
                            Ver Quiz
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
} 
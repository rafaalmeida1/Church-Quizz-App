import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import { getSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { user } = await getSession()
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: "Não autenticado" 
      }, { status: 401 })
    }
    
    const userId = user.id
    const { notificationId } = await request.json()
    
    if (!notificationId) {
      return NextResponse.json({ 
        success: false, 
        error: "ID da notificação é obrigatório" 
      }, { status: 400 })
    }
    
    // Buscar todas as notificações do usuário
    const notifications = await kv.lrange(`notifications:${userId}`, 0, -1)
    
    // Encontrar e atualizar a notificação específica
    const updatedNotifications = notifications.map((notifString: string) => {
      try {
        const notif = JSON.parse(notifString)
        if (notif.id === notificationId) {
          return JSON.stringify({
            ...notif,
            read: true
          })
        }
        return notifString
      } catch (e) {
        return notifString
      }
    })
    
    // Atualizar a lista de notificações
    await kv.del(`notifications:${userId}`)
    if (updatedNotifications.length > 0) {
      await kv.rpush(`notifications:${userId}`, ...updatedNotifications)
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Notificação marcada como lida" 
    })
    
  } catch (error) {
    console.error("Erro ao marcar notificação como lida:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Falha ao atualizar notificação" 
    }, { status: 500 })
  }
} 
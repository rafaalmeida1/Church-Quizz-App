import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { user } = await getSession()
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: "Não autenticado" 
      }, { status: 401 })
    }
    
    const userId = user.id
    
    // Buscar notificações pendentes do usuário
    const notifications = await kv.lrange(`notifications:${userId}`, 0, -1)
    
    // Converte as notificações de string para objeto
    const parsedNotifications = notifications.map((notification: string) => {
      try {
        return JSON.parse(notification)
      } catch (e) {
        return null
      }
    }).filter(Boolean)
    
    return NextResponse.json({ 
      success: true, 
      notifications: parsedNotifications 
    })
    
  } catch (error) {
    console.error("Erro ao buscar notificações:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Falha ao buscar notificações" 
    }, { status: 500 })
  }
} 
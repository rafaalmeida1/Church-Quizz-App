import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import { getQuiz } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Para endpoints de processamento de erros, permitimos chamadas sem autenticação
    // para que serviços de background possam reportar erros
    const payload = await request.json()
    const { message, quizId, adminKey } = payload
    
    // Verificação de segurança básica para chamadas não autenticadas
    const systemKey = process.env.ADMIN_API_KEY || 'default-system-key'
    const isSystemCall = adminKey === systemKey
    
    if (!message) {
      return NextResponse.json({ 
        success: false, 
        error: "Mensagem de erro não fornecida" 
      }, { status: 400 })
    }
    
    let userId = null
    
    // Se temos um quizId, buscamos o quiz para obter o userId do criador
    if (quizId) {
      // Verificamos se o ID tem o prefixo quiz: que é usado no sistema
      const quizKey = quizId.startsWith('quiz:') ? quizId : `quiz:${quizId}`
      
      try {
        const quiz = await getQuiz(quizKey)
        
        if (!quiz) {
          return NextResponse.json({ 
            success: false, 
            error: "Quiz não encontrado" 
          }, { status: 404 })
        }
        
        userId = quiz.criadoPor
        
        // Verifica se obtivemos um userId válido
        if (!userId) {
          console.error("Quiz encontrado mas sem usuário criador:", quizKey)
          return NextResponse.json({ 
            success: false, 
            error: "Não foi possível identificar o criador do quiz" 
          }, { status: 400 })
        }
      } catch (error) {
        console.error("Erro ao obter quiz:", error)
        return NextResponse.json({ 
          success: false, 
          error: "Erro ao buscar informações do quiz" 
        }, { status: 500 })
      }
    } else if (isSystemCall) {
      // Para erros de sistema sem quizId específico
      console.error("Erro de sistema sem quizId:", message)
      
      // Retorna sucesso mesmo sem salvar notificação, pois registramos o erro
      return NextResponse.json({ 
        success: true, 
        message: "Erro registrado no sistema" 
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        error: "Chamadas sem quizId exigem adminKey válida" 
      }, { status: 401 })
    }
    
    // Salvar na lista de notificações pendentes para o usuário
    const notificationId = `error_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    
    await kv.lpush(`notifications:${userId}`, JSON.stringify({
      type: "quiz_error",
      quizId: quizId,
      message: message,
      timestamp: Date.now(),
      read: false,
      id: notificationId
    }))
    
    // Manter apenas as 20 notificações mais recentes
    await kv.ltrim(`notifications:${userId}`, 0, 19)
    
    return NextResponse.json({ 
      success: true, 
      message: "Notificação de erro enviada com sucesso",
      notificationId
    })
    
  } catch (error) {
    console.error("Erro ao processar notificação de erro:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Falha ao processar notificação de erro" 
    }, { status: 500 })
  }
}

// Também adicionamos um endpoint GET para este caminho específico para
// permitir leitura de notificações de erro de quiz para o usuário autenticado
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
    
    // Extrair quizId da URL se presente
    const url = new URL(request.url)
    const quizId = url.searchParams.get('quizId')
    
    // Buscar notificações pendentes do usuário
    const allNotifications = await kv.lrange(`notifications:${userId}`, 0, -1)
    
    // Filtra notificações por tipo e opcionalmente por quizId
    const errorNotifications = allNotifications
      .map((notification: string) => {
        try {
          return JSON.parse(notification)
        } catch (e) {
          return null
        }
      })
      .filter(notification => 
        notification && 
        notification.type === 'quiz_error' && 
        (!quizId || notification.quizId === quizId)
      )
    
    return NextResponse.json({ 
      success: true, 
      notifications: errorNotifications
    })
    
  } catch (error) {
    console.error("Erro ao buscar notificações de erro:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Falha ao buscar notificações de erro" 
    }, { status: 500 })
  }
} 
import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import { getQuiz } from '@/lib/db'
import { getSession } from '@/lib/auth'

/**
 * API endpoint to handle quiz error notifications
 */
export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await getSession()
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: "Não autenticado" },
        { status: 401 }
      )
    }

    // Parse the request data
    const data = await request.json()
    const { quizId, questionId, errorDescription, reportedBy } = data
    
    // Validate required fields
    if (!quizId || !errorDescription) {
      return NextResponse.json(
        { success: false, error: "Campos obrigatórios: quizId e errorDescription" },
        { status: 400 }
      )
    }

    // Create error report object
    const errorReport = {
      id: `error:${Date.now()}`,
      quizId,
      questionId: questionId || null,
      errorDescription,
      reportedBy: reportedBy || session.user.id,
      reportedAt: new Date().toISOString(),
      status: "pending"
    }
    
    // Store the error report
    await kv.set(errorReport.id, JSON.stringify(errorReport))
    
    // Add to list of error reports
    await kv.lpush('quiz:error:reports', errorReport.id)
    
    // Return success response
    return NextResponse.json({
      success: true,
      reportId: errorReport.id,
      message: "Relatório de erro registrado com sucesso"
    })
    
  } catch (error) {
    console.error("[QUIZ ERROR] Erro:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Erro ao registrar problema" 
      },
      { status: 500 }
    )
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
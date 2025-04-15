import { NextRequest, NextResponse } from 'next/server'
import { getQuiz } from '@/lib/db'
import { kv } from '@vercel/kv'

export async function POST(request: NextRequest) {
  try {
    const { quizId } = await request.json()
    
    if (!quizId) {
      return NextResponse.json({ 
        success: false, 
        error: "ID do quiz não fornecido" 
      }, { status: 400 })
    }
    
    // Obter o quiz
    const quiz = await getQuiz(quizId)
    
    if (!quiz) {
      return NextResponse.json({ 
        success: false, 
        error: "Quiz não encontrado" 
      }, { status: 404 })
    }
    
    // Salvar na lista de notificações pendentes para o usuário
    // Quando o usuário acessar, o frontend poderá buscar e exibir as notificações
    await kv.lpush(`notifications:${quiz.criadoPor}`, JSON.stringify({
      type: "quiz_ready",
      quizId: quizId,
      quizTitle: quiz.titulo,
      timestamp: Date.now(),
      read: false
    }))
    
    // Manter apenas as 20 notificações mais recentes
    await kv.ltrim(`notifications:${quiz.criadoPor}`, 0, 19)
    
    return NextResponse.json({ 
      success: true, 
      message: "Notificação enviada com sucesso" 
    })
    
  } catch (error) {
    console.error("Erro ao enviar notificação:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Falha ao enviar notificação" 
    }, { status: 500 })
  }
} 
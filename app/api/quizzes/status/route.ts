import { NextRequest, NextResponse } from 'next/server'
import { getQuiz } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Verificar a autenticação
    const { user } = await getSession()
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: "Usuário não autenticado" 
      }, { status: 401 })
    }
    
    // Obter o ID do quiz da query string
    const searchParams = request.nextUrl.searchParams
    const quizId = searchParams.get('quizId')
    
    if (!quizId) {
      return NextResponse.json({ 
        success: false, 
        error: "ID do quiz não fornecido" 
      }, { status: 400 })
    }
    
    // Buscar o quiz
    const quiz = await getQuiz(quizId)
    
    if (!quiz) {
      return NextResponse.json({ 
        success: false, 
        error: "Quiz não encontrado" 
      }, { status: 404 })
    }
    
    // Retornar o status do quiz
    return NextResponse.json({ 
      success: true, 
      status: quiz.status,
      quiz: {
        id: quizId,
        titulo: quiz.titulo,
        status: quiz.status,
        erro: quiz.erro
      }
    })
    
  } catch (error) {
    console.error("Erro ao verificar status do quiz:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Falha ao verificar status do quiz" 
    }, { status: 500 })
  }
} 
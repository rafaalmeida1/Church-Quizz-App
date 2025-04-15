import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { repairQuiz, getQuiz } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getSession()
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: "Não autenticado" },
        { status: 401 }
      )
    }
    
    // Get quiz ID from request body
    const { quizId } = await request.json()
    
    if (!quizId) {
      return NextResponse.json(
        { success: false, error: "ID do quiz não fornecido" },
        { status: 400 }
      )
    }
    
    console.log(`Attempting to repair quiz: ${quizId}`)
    
    // Repair the quiz
    const success = await repairQuiz(quizId)
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: "Não foi possível reparar o quiz" },
        { status: 500 }
      )
    }
    
    // Get the repaired quiz
    const repairedQuiz = await getQuiz(quizId)
    
    return NextResponse.json({
      success: true,
      message: "Quiz reparado com sucesso",
      quiz: repairedQuiz
    })
    
  } catch (error) {
    console.error("Error repairing quiz:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Erro ao reparar quiz" 
      },
      { status: 500 }
    )
  }
} 
import { NextResponse } from 'next/server'
import { getQuiz } from '@/lib/db'
import { getSessionData } from "@/app/actions"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Extrair e decodificar o ID do quiz
    const quizId = decodeURIComponent(params.id)
    
    // Validar o ID do quiz
    if (!quizId || quizId === 'create' || quizId === 'undefined') {
      console.error("ID de quiz inválido:", quizId)
      return NextResponse.json(
        { success: false, error: "ID de quiz inválido" },
        { status: 400 }
      )
    }

    // Buscar o quiz do banco de dados
    const quiz = await getQuiz(quizId)

    if (!quiz) {
      console.error("Quiz não encontrado com ID:", quizId)
      return NextResponse.json(
        { success: false, error: "Quiz não encontrado" },
        { status: 404 }
      )
    }

    // Retorna os dados do quiz
    return NextResponse.json({ 
      success: true, 
      quiz: {
        ...quiz,
        id: quizId
      }
    })
  } catch (error) {
    console.error("Erro ao buscar quiz:", error)
    return NextResponse.json(
      { success: false, error: "Erro ao buscar quiz" },
      { status: 500 }
    )
  }
} 
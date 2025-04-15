import { NextResponse } from 'next/server'
import { getQuiz } from '@/lib/db'
import { getSessionData } from "@/app/actions"
import { getSession } from "@/lib/auth"
import { kv } from "@vercel/kv"

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

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar a autenticação
    const { user } = await getSession()
    
    if (!user || (user.role !== "admin" && user.role !== "catequista")) {
      return NextResponse.json({ 
        success: false, 
        error: "Sem permissão para excluir quizzes" 
      }, { status: 403 })
    }
    
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
    
    // Buscar o quiz para verificar se existe
    const quiz = await getQuiz(quizId)
    
    if (!quiz) {
      return NextResponse.json({ 
        success: false, 
        error: "Quiz não encontrado" 
      }, { status: 404 })
    }
    
    // Verificar permissão para excluir (apenas o criador ou admin)
    if (user.role !== "admin" && quiz.criadoPor !== user.id) {
      return NextResponse.json({ 
        success: false, 
        error: "Sem permissão para excluir este quiz" 
      }, { status: 403 })
    }
    
    // Excluir o quiz do Redis
    await kv.del(quizId)
    
    // Remover o quiz da lista de quizzes da paróquia
    await kv.srem(`parish:${quiz.parishId}:quizzes`, quizId)
    
    return NextResponse.json({ 
      success: true, 
      message: "Quiz excluído com sucesso" 
    })
    
  } catch (error) {
    console.error("Erro ao excluir quiz:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Falha ao excluir quiz" 
    }, { status: 500 })
  }
} 
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getQuiz } from '@/lib/db'
import { kv } from '@vercel/kv'

// GET endpoint para obter informações do quiz
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const quizId = params.id.startsWith('quiz:') ? params.id : `quiz:${params.id}`
    
    // Retrieve quiz from KV store
    const quizData = await kv.get(quizId)
    
    if (!quizData) {
      return NextResponse.json(
        { success: false, error: "Quiz não encontrado" },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      quiz: quizData
    })
    
  } catch (error) {
    console.error("[QUIZ GET] Erro:", error)
    return NextResponse.json(
      { success: false, error: "Erro ao buscar quiz" },
      { status: 500 }
    )
  }
}

// PATCH endpoint para atualizar informações do quiz
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const { user } = await getSession()
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: "Usuário não autenticado" 
      }, { status: 401 })
    }
    
    const quizId = params.id
    
    // Buscar o quiz existente
    const quiz = await getQuiz(quizId)
    
    if (!quiz) {
      return NextResponse.json({ 
        success: false, 
        error: "Quiz não encontrado" 
      }, { status: 404 })
    }
    
    // Verificar permissão (apenas o criador pode editar)
    if (quiz.criadoPor !== user.id) {
      return NextResponse.json({ 
        success: false, 
        error: "Sem permissão para editar este quiz" 
      }, { status: 403 })
    }
    
    // Obter os dados da requisição
    const data = await request.json()
    const { titulo, descricao, tipo } = data
    
    // Validar os dados
    if (!titulo || !descricao || !tipo) {
      return NextResponse.json({ 
        success: false, 
        error: "Dados incompletos" 
      }, { status: 400 })
    }
    
    // Atualizar o quiz
    const updatedFields = {
      titulo,
      descricao,
      tipo
    }
    
    await kv.hset(quizId, updatedFields)
    
    // Retornar sucesso
    return NextResponse.json({ 
      success: true, 
      message: "Quiz atualizado com sucesso"
    })
    
  } catch (error) {
    console.error("Erro ao atualizar quiz:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Falha ao atualizar quiz" 
    }, { status: 500 })
  }
}

// DELETE endpoint para excluir um quiz
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const session = await getSession()
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: "Não autenticado" },
        { status: 401 }
      )
    }
    
    // Format quiz ID
    const quizId = params.id.startsWith('quiz:') ? params.id : `quiz:${params.id}`
    
    // Get quiz data
    const quizData = await kv.get(quizId)
    
    if (!quizData) {
      return NextResponse.json(
        { success: false, error: "Quiz não encontrado" },
        { status: 404 }
      )
    }
    
    const quiz = typeof quizData === 'string' ? JSON.parse(quizData) : quizData
    
    // Check if user has permission (creator, admin, or proper role)
    const isCreator = quiz.criadoPor === session.user.id
    const isAdmin = session.user.role === 'admin'
    
    if (!isCreator && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Sem permissão para apagar este quiz" },
        { status: 403 }
      )
    }
    
    // Remove quiz from parish list
    if (quiz.parishId) {
      const parishQuizzesKey = `parish:${quiz.parishId}:quizzes`
      await kv.srem(parishQuizzesKey, quizId)
    }
    
    // Delete the quiz
    await kv.del(quizId)
    
    return NextResponse.json({
      success: true,
      message: "Quiz apagado com sucesso"
    })
    
  } catch (error) {
    console.error("[QUIZ DELETE] Erro:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Erro ao apagar quiz" 
      },
      { status: 500 }
    )
  }
} 
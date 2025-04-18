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
    // Authenticate user
    const session = await getSession()
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: "Não autenticado" },
        { status: 401 }
      )
    }
    
    const quizId = params.id.startsWith('quiz:') ? params.id : `quiz:${params.id}`
    
    // Retrieve quiz from KV store
    const quizData = await kv.get(quizId)
    
    if (!quizData) {
      return NextResponse.json(
        { success: false, error: "Quiz não encontrado" },
        { status: 404 }
      )
    }
    
    // Parse quiz data
    const quiz = typeof quizData === 'string' ? JSON.parse(quizData) : quizData
    
    // Verify tenant isolation - user must be from the same parish or an admin
    const isFromSameParish = quiz.parishId === session.user.parishId
    const isAdmin = session.user.role === 'admin'
    
    if (!isFromSameParish && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Sem permissão para acessar este quiz" },
        { status: 403 }
      )
    }
    
    return NextResponse.json({
      success: true,
      quiz
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
    
    // Verify tenant isolation - user must be from the same parish
    const isFromSameParish = quiz.parishId === session.user.parishId
    const isAdmin = session.user.role === 'admin'
    const isCreator = quiz.criadoPor === session.user.id
    
    // Only creator from same parish or admin can edit
    if ((!isCreator || !isFromSameParish) && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Sem permissão para editar este quiz" },
        { status: 403 }
      )
    }
    
    // Obter os dados da requisição
    const data = await request.json()
    const { titulo, descricao, tipo } = data
    
    // Validar os dados
    if (!titulo || !descricao || !tipo) {
      return NextResponse.json(
        { success: false, error: "Dados incompletos" },
        { status: 400 }
      )
    }
    
    // Atualizar o quiz com os novos dados
    const updatedQuiz = {
      ...quiz,
      titulo,
      descricao,
      tipo,
      atualizadoEm: new Date().toISOString()
    }
    
    // Salvar as alterações
    await kv.set(quizId, JSON.stringify(updatedQuiz))
    
    // Retornar sucesso
    return NextResponse.json({ 
      success: true, 
      message: "Quiz atualizado com sucesso"
    })
    
  } catch (error) {
    console.error("[QUIZ UPDATE] Erro:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Erro ao atualizar quiz" 
      },
      { status: 500 }
    )
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
    
    // Verify tenant isolation - user must be from the same parish
    const isFromSameParish = quiz.parishId === session.user.parishId
    const isAdmin = session.user.role === 'admin'
    const isCreator = quiz.criadoPor === session.user.id
    
    // Check if user has permission (creator from same parish or admin)
    if ((!isCreator || !isFromSameParish) && !isAdmin) {
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
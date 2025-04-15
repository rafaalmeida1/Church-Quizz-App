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
    // Verificar autenticação
    const { user } = await getSession()
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: "Usuário não autenticado" 
      }, { status: 401 })
    }
    
    const quizId = params.id
    
    // Buscar o quiz
    const quiz = await getQuiz(quizId)
    
    if (!quiz) {
      return NextResponse.json({ 
        success: false, 
        error: "Quiz não encontrado" 
      }, { status: 404 })
    }
    
    // Verificar permissão (apenas o criador ou alguém da mesma paróquia pode ver)
    if (quiz.criadoPor !== user.id && quiz.parishId !== user.parishId) {
      return NextResponse.json({ 
        success: false, 
        error: "Sem permissão para acessar este quiz" 
      }, { status: 403 })
    }
    
    // Retornar os dados do quiz
    return NextResponse.json({ 
      success: true, 
      quiz: {
        ...quiz,
        id: quizId
      }
    })
    
  } catch (error) {
    console.error("Erro ao obter quiz:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Falha ao obter informações do quiz" 
    }, { status: 500 })
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
    
    // Verificar permissão (apenas o criador pode excluir)
    if (quiz.criadoPor !== user.id && user.role !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        error: "Sem permissão para excluir este quiz" 
      }, { status: 403 })
    }
    
    // Remover o quiz dos conjuntos
    await kv.srem(`parish:${quiz.parishId}:quizzes`, quizId)
    
    // Excluir o quiz
    await kv.del(quizId)
    
    // Retornar sucesso
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
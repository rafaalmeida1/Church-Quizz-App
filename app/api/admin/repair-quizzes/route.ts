import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { repairQuiz, repairParishQuizzes } from '@/lib/db'

/**
 * API endpoint to repair corrupted quizzes
 */
export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated and is an admin
    const session = await getSession()
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: "Não autenticado" },
        { status: 401 }
      )
    }
    
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: "Permissão negada. Apenas administradores podem reparar quizzes." },
        { status: 403 }
      )
    }
    
    // Parse the request data
    const data = await request.json()
    const { quizId, parishId } = data
    
    // Validate required fields
    if (!quizId && !parishId) {
      return NextResponse.json(
        { success: false, error: "Você deve fornecer quizId ou parishId" },
        { status: 400 }
      )
    }
    
    let result;
    
    // Repair a specific quiz if quizId is provided
    if (quizId) {
      const success = await repairQuiz(quizId)
      result = { 
        success, 
        message: success 
          ? `Quiz ${quizId} reparado com sucesso` 
          : `Falha ao reparar quiz ${quizId}`
      }
    } 
    // Repair all quizzes in a parish if parishId is provided
    else if (parishId) {
      const repairResult = await repairParishQuizzes(parishId)
      result = {
        success: true,
        ...repairResult,
        message: `Reparação concluída: ${repairResult.repaired} reparados, ${repairResult.failed} falhas de um total de ${repairResult.total} quizzes`
      }
    }
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error("[QUIZ REPAIR] Erro:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Erro ao reparar quizzes" 
      },
      { status: 500 }
    )
  }
} 
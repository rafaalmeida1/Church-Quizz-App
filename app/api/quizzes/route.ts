import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { kv } from '@vercel/kv'

/**
 * GET endpoint to list quizzes with tenant isolation
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getSession()
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: "Não autenticado" },
        { status: 401 }
      )
    }
    
    // Get parish ID from authenticated user
    const parishId = session.user.parishId
    
    if (!parishId) {
      return NextResponse.json(
        { success: false, error: "Usuário não está associado a uma paróquia" },
        { status: 400 }
      )
    }
    
    // Get query parameters
    const url = new URL(request.url)
    const status = url.searchParams.get('status') // 'ativo', 'inativo', 'todos'
    const tipo = url.searchParams.get('tipo') // 'adulto', 'crianca', 'todos'
    
    // Get all quiz IDs for this parish
    const parishQuizzesKey = `parish:${parishId}:quizzes`
    const quizIds = await kv.smembers(parishQuizzesKey) || []
    
    if (!quizIds || quizIds.length === 0) {
      return NextResponse.json({
        success: true,
        quizzes: []
      })
    }
    
    // Fetch all quizzes in parallel
    const quizDataPromises = quizIds.map(quizId => kv.get(quizId))
    const quizDataResults = await Promise.all(quizDataPromises)
    
    // Parse quiz data
    let quizzes = quizDataResults
      .filter(Boolean) // Remove null/undefined results
      .map(quizData => {
        // Parse JSON if needed
        return typeof quizData === 'string' ? JSON.parse(quizData) : quizData
      })
    
    // Apply filters
    if (status && status !== 'todos') {
      quizzes = quizzes.filter(quiz => quiz.status === status)
    }
    
    if (tipo && tipo !== 'todos') {
      quizzes = quizzes.filter(quiz => quiz.tipo === tipo)
    }
    
    // Sort by creation date (newest first)
    quizzes.sort((a, b) => {
      const dateA = new Date(a.criadoEm).getTime()
      const dateB = new Date(b.criadoEm).getTime()
      return dateB - dateA
    })
    
    return NextResponse.json({
      success: true,
      quizzes
    })
    
  } catch (error) {
    console.error("[QUIZ LIST] Erro:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Erro ao listar quizzes" 
      },
      { status: 500 }
    )
  }
} 
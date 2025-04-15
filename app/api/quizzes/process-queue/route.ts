import { NextRequest, NextResponse } from 'next/server'

/**
 * Este endpoint não é mais necessário pois o processamento da fila foi substituído 
 * por geração direta de questões durante a criação do quiz.
 * 
 * Mantido apenas para retrocompatibilidade, mas não faz nada.
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    success: true, 
    message: "A geração de quizzes agora ocorre na criação. Este endpoint está desativado.",
    info: "A funcionalidade de fila foi substituída por geração direta na criação do quiz."
  })
} 
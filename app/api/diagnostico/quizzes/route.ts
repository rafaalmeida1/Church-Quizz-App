import { NextResponse } from 'next/server'
import { getParishQuizzes, getQuizResponses } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    // Verificar autenticação
    const { user, parishId } = await getSession()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Acesso não autorizado' 
      }, { status: 403 })
    }
    
    if (!parishId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Usuário não está associado a uma paróquia' 
      }, { status: 400 })
    }
    
    // Obter todos os quizzes da paróquia
    const quizzes = await getParishQuizzes(parishId)
    
    // Obter estatísticas para cada quiz
    const quizzesComEstatisticas = await Promise.all(
      quizzes.map(async (quiz) => {
        const responses = await getQuizResponses(quiz.id!)
        return {
          id: quiz.id,
          titulo: quiz.titulo,
          tipo: quiz.tipo,
          status: quiz.status,
          numQuestoes: quiz.questoes.length,
          criadoEm: new Date(quiz.criadoEm).toISOString(),
          expiraEm: new Date(quiz.expiraEm).toISOString(),
          expirado: quiz.expiraEm < Date.now(),
          respostas: responses.length
        }
      })
    )
    
    // Estatísticas gerais
    const estatisticas = {
      total: quizzes.length,
      porStatus: {
        pendente: quizzes.filter(q => q.status === 'pendente').length,
        ativo: quizzes.filter(q => q.status === 'ativo').length,
        encerrado: quizzes.filter(q => q.status === 'encerrado').length,
      },
      porTipo: {
        adulto: quizzes.filter(q => q.tipo === 'adulto').length,
        crianca: quizzes.filter(q => q.tipo === 'crianca').length,
      },
      expirados: quizzes.filter(q => q.expiraEm < Date.now()).length,
    }
    
    return NextResponse.json({
      success: true,
      parishId,
      estatisticas,
      quizzes: quizzesComEstatisticas
    })
  } catch (error) {
    console.error('Erro ao diagnosticar quizzes:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Falha ao listar quizzes',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 
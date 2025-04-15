import { NextResponse } from 'next/server'
import { getQuiz, getQuizResponses, getUser } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { kv } from '@vercel/kv'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const { user } = await getSession()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Acesso não autorizado' 
      }, { status: 403 })
    }
    
    const quizId = params.id
    
    // Verificar se o ID existe no Redis
    const existsInRedis = await kv.exists(quizId)
    
    // Obter dados do quiz
    const quiz = await getQuiz(quizId)
    
    // Obter respostas do quiz
    const responses = await getQuizResponses(quizId)
    
    // Obter informações do criador
    let creator = null
    if (quiz?.criadoPor) {
      const fullCreator = await getUser(quiz.criadoPor)
      // Remover campos sensíveis
      if (fullCreator) {
        creator = {
          id: fullCreator.id,
          nome: fullCreator.nome,
          email: fullCreator.email,
          role: fullCreator.role,
          parishId: fullCreator.parishId,
          tipo: fullCreator.tipo,
          criadoEm: fullCreator.criadoEm
        }
      }
    }
    
    // Resultado do diagnóstico
    const result = {
      success: true,
      diagnostico: {
        quizId,
        existeNoRedis: !!existsInRedis,
        quizCarregado: !!quiz,
        detalhesQuiz: quiz ? {
          titulo: quiz.titulo,
          status: quiz.status,
          tipo: quiz.tipo,
          temQuestoes: !!quiz.questoes && Array.isArray(quiz.questoes),
          numQuestoes: quiz.questoes?.length || 0,
          criadoEm: new Date(quiz.criadoEm).toISOString(),
          expiraEm: new Date(quiz.expiraEm).toISOString(),
          expirado: quiz.expiraEm < Date.now(),
          parishId: quiz.parishId,
        } : null,
        respostas: {
          total: responses.length,
          respondidoPor: responses.map(r => r.userId)
        },
        criador: creator
      }
    }
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Erro no diagnóstico do quiz:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Falha ao diagnosticar quiz',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 
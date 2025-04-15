import { NextRequest, NextResponse } from 'next/server'
import { createQuiz } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { Quiz, Question } from '@/lib/types'
import crypto from 'crypto'
import { kv } from '@vercel/kv'
import { generateQuizQuestions } from '@/lib/ai'

// Função para gerar uma questão temporária simples
function generateTemporaryQuestion(): Question {
  return {
    id: crypto.randomBytes(8).toString('hex'),
    texto: "Gerando questões...",
    opcoes: ["Aguarde", "Estamos preparando", "Questões incríveis", "Para você"],
    opcaoCorreta: 0
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar a autenticação
    const { user, parishId } = await getSession()
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: "Usuário não autenticado" 
      }, { status: 401 })
    }
    
    if (!parishId) {
      return NextResponse.json({ 
        success: false, 
        error: "Usuário não está associado a uma paróquia" 
      }, { status: 400 })
    }

    // Processar o FormData
    const formData = await request.formData()
    const titulo = formData.get("titulo") as string
    const descricao = formData.get("descricao") as string
    const tema = formData.get("tema") as string
    const tipo = formData.get("tipo") as "adulto" | "crianca"
    const criadoPor = formData.get("criadoPor") as string

    // Validar os dados
    if (!titulo || !descricao || !tema || !tipo || !criadoPor) {
      return NextResponse.json({ 
        success: false, 
        error: "Dados incompletos" 
      }, { status: 400 })
    }

    // Define a data de expiração para 7 dias a partir de agora
    const expiraEm = Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 dias em milissegundos

    // Iniciar a geração imediatamente em segundo plano
    const generateQuestionsPromise = generateQuizQuestions(tema, tipo)
    
    // Iniciar com perguntas temporárias enquanto as reais são geradas
    const tempQuestoes: Question[] = Array(15).fill(null).map(() => generateTemporaryQuestion())
    
    // Criar o quiz com questões temporárias
    const quizTemp: Quiz = {
      titulo,
      descricao,
      tema,
      tipo,
      parishId,
      criadoPor,
      questoes: tempQuestoes,
      criadoEm: Date.now(),
      expiraEm: expiraEm,
      status: "gerando", // Status especial para indicar que está em geração
      pontuacaoMaxima: 150, // 10 pontos por questão (15 questões)
    }

    // Salvar o quiz com questões temporárias
    const quizId = await createQuiz(quizTemp)
    
    // Função para atualizar o quiz quando as questões estiverem prontas
    const updateQuizWithQuestions = async () => {
      try {
        console.log(`Iniciando geração de questões para quiz ${quizId}`)
        
        // Aguardar a conclusão da geração de questões
        const questoes = await generateQuestionsPromise
        
        // Atualizar o quiz com as questões reais
        await kv.hset(quizId, { 
          questoes: JSON.stringify(questoes),
          status: "pendente", // Atualiza para pendente (aguardando aprovação)
          pontuacaoMaxima: questoes.length * 10 // 10 pontos por questão
        })
        
        console.log(`Questões geradas com sucesso para quiz ${quizId}`)
      } catch (error) {
        console.error(`Erro na geração de questões para quiz ${quizId}:`, error)
        
        // Atualizar o status para erro
        await kv.hset(quizId, { 
          status: "erro",
          erro: "Falha ao gerar questões. Entre em contato com o administrador."
        })
        
        // Enviar notificação de erro
        try {
          await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/notifications/quiz-error`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              quizId,
              message: "Falha ao gerar as questões para o quiz.", 
              adminKey: process.env.ADMIN_API_KEY
            }),
          })
        } catch (notifError) {
          console.error("Erro ao enviar notificação:", notifError)
        }
      }
    }
    
    // Iniciar o processo de atualização em segundo plano
    updateQuizWithQuestions()
    
    // Retornar sucesso imediatamente
    return NextResponse.json({ 
      success: true, 
      quizId, 
      message: "Quiz em geração. As questões estarão prontas em breve."
    })
    
  } catch (error) {
    console.error("Erro ao criar quiz:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Falha ao criar quiz" 
    }, { status: 500 })
  }
} 
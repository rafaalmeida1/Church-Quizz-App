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

    try {
      // Define a data de expiração para 7 dias a partir de agora
      const expiraEm = Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 dias em milissegundos

      console.log(`Gerando questões para o tema: "${tema}" (${tipo})`)
      
      // Criamos o quiz com questões reais imediatamente em vez de usar placeholders
      // Isso faz com que o usuário precise esperar um pouco mais pela resposta,
      // mas garante que o quiz será criado com as questões corretas
      const questoes = await generateQuizQuestions(tema, tipo)
      
      console.log(`Questões geradas com sucesso (${questoes.length}) para quiz de tema "${tema}"`)
      
      // Criar o quiz com as questões reais
      const quiz: Quiz = {
        titulo,
        descricao,
        tema,
        tipo,
        parishId,
        criadoPor,
        questoes: questoes,
        criadoEm: Date.now(),
        expiraEm: expiraEm,
        status: "pendente", // Status ativo, já pronto para uso
        pontuacaoMaxima: questoes.length * 10 // 10 pontos por questão
      }
  
      // Salvar o quiz com as questões reais
      const quizId = await createQuiz(quiz)
      
      console.log(`Quiz ${quizId} criado com sucesso`)
      
      // Retornar sucesso imediatamente
      return NextResponse.json({ 
        success: true, 
        quizId, 
        message: "Quiz criado com sucesso!"
      })
    } catch (genError: any) {
      console.error("Erro ao gerar questões:", genError)
      return NextResponse.json({ 
        success: false, 
        error: `Falha ao gerar o quiz: ${genError.message || "Erro desconhecido"}` 
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error("Erro ao criar quiz:", error)
    return NextResponse.json({ 
      success: false, 
      error: `Falha ao criar quiz: ${error.message || "Erro desconhecido"}` 
    }, { status: 500 })
  }
} 
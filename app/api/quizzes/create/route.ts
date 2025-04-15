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

// Recebe os dados do quiz e cria um novo quiz
export async function POST(request: NextRequest) {
  try {
    // Verifica se o usuário está autenticado
    const session = await getSession()
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: "Não autenticado" },
        { status: 401 }
      )
    }

    // Log para depuração
    console.log(`[QUIZ CREATE] Iniciando criação de quiz por usuário: ${session.user.id}`)
    
    // Parse dos dados do formulário
    const formData = await request.formData()
    const titulo = formData.get("titulo") as string
    const descricao = formData.get("descricao") as string
    const tema = formData.get("tema") as string
    const tipo = formData.get("tipo") as string
    const parishId = formData.get("parishId") as string
    const criadoPor = formData.get("criadoPor") as string
    
    // Validações
    if (!titulo || !descricao || !tema || !tipo || !parishId || !criadoPor) {
      console.log("[QUIZ CREATE] Dados incompletos:", {
        titulo, descricao, tema, tipo, parishId, criadoPor
      })
      return NextResponse.json(
        { success: false, error: "Todos os campos são obrigatórios" },
        { status: 400 }
      )
    }

    // Verifica se o usuário tem permissão para criar quiz nesta paróquia
    if (tipo === "crianca" && !["admin", "catequista"].includes(session.user.tipo || "")) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Apenas catequistas e administradores podem criar quizzes para crianças" 
        },
        { status: 403 }
      )
    }

    // Gerar um ID para o quiz
    const quizId = `quiz:${Date.now()}`
    
    console.log(`[QUIZ CREATE] Gerando questões para o quiz ID: ${quizId}`)
    
    // Verificar se o tema está definido
    if (!tema) {
      return NextResponse.json(
        { error: "O tema do quiz é obrigatório" },
        { status: 400 }
      )
    }
    
    // Gerar as questões diretamente usando a IA
    let questoes = [];
    try {
      questoes = await generateQuizQuestions(
        tema,
        tipo as "crianca" | "adulto"
      ) || [];
    } catch (questionsError) {
      console.error(`[QUIZ CREATE] Erro ao gerar questões:`, questionsError);
      return NextResponse.json(
        { 
          success: false, 
          error: "Falha ao gerar questões. Por favor, tente novamente com um tema mais específico." 
        },
        { status: 500 }
      );
    }
    
    // Verificar se as questões foram geradas corretamente
    if (!questoes || questoes.length === 0) {
      console.error(`[QUIZ CREATE] Falha ao gerar questões para o quiz ID: ${quizId}`)
      throw new Error("Não foi possível gerar questões para este quiz. Tente um tema mais específico.")
    }
    
    console.log(`[QUIZ CREATE] Geradas ${questoes.length} questões para o quiz ID: ${quizId}`)
    
    // Criar o objeto quiz
    const quiz = {
      id: quizId,
      titulo,
      descricao,
      tema,
      tipo,
      parishId,
      criadoPor,
      criadoEm: new Date().toISOString(),
      status: "ativo", // Status ativo, pronto para uso imediato
      questoes
    }
    
    // Salvar o quiz no KV
    await kv.set(quizId, JSON.stringify(quiz))
    
    // Adicionar o id do quiz à lista de quizzes da paróquia
    const parishQuizzesKey = `parish:${parishId}:quizzes`
    await kv.sadd(parishQuizzesKey, quizId)
    
    console.log(`[QUIZ CREATE] Quiz criado com sucesso: ${quizId}`)
    
    // Resposta de sucesso
    return NextResponse.json({
      success: true,
      quizId,
      questionsCount: questoes.length,
      message: `Quiz criado com sucesso com ${questoes.length} questões!`
    })
    
  } catch (error) {
    console.error("[QUIZ CREATE] Erro:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Erro ao criar quiz" 
      },
      { status: 500 }
    )
  }
} 
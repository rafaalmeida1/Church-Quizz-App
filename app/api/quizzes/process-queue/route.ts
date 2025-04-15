import { NextRequest, NextResponse } from 'next/server'
import { getQuiz } from '@/lib/db'
import { generateQuizQuestions } from '@/lib/ai'
import { kv } from '@vercel/kv'

// Função para processar a fila de gerações pendentes
async function processGenerationQueue() {
  // Limitar a processar apenas um item por vez para não sobrecarregar
  const pendingGenerationJson = await kv.rpop("pending_quiz_generations")
  
  if (!pendingGenerationJson) {
    return { status: "success", message: "Nenhum quiz pendente na fila" }
  }
  
  try {
    const pendingGeneration = JSON.parse(pendingGenerationJson)
    const { quizId, tema, tipo } = pendingGeneration
    
    console.log(`Processando geração para quiz ${quizId}, tema: ${tema}, tipo: ${tipo}`)
    
    // Verificar se o quiz existe
    const quiz = await getQuiz(quizId)
    if (!quiz) {
      console.error(`Quiz ${quizId} não encontrado`)
      return { status: "error", message: `Quiz ${quizId} não encontrado` }
    }
    
    // Verificar se já não foi processado
    if (quiz.status !== "gerando") {
      console.log(`Quiz ${quizId} já foi processado (status: ${quiz.status})`)
      return { status: "success", message: `Quiz ${quizId} já foi processado (status: ${quiz.status})` }
    }
    
    console.log(`Gerando questões para quiz ${quizId}...`)
    
    // Gerar as questões
    const questoes = await generateQuizQuestions(tema, tipo)
    
    // Atualizar o quiz com as questões geradas
    await kv.hset(quizId, { 
      questoes: JSON.stringify(questoes),
      status: "pendente", // Atualiza para pendente (aguardando aprovação)
      pontuacaoMaxima: questoes.length * 10 // 10 pontos por questão
    })
    
    console.log(`Questões geradas com sucesso para quiz ${quizId}`)
    return { status: "success", message: `Questões geradas com sucesso para quiz ${quizId}` }
  } catch (error) {
    console.error(`Erro ao processar geração:`, error)
    
    // Se houve um erro com esse quiz específico, marcar como erro
    try {
      const pendingGeneration = JSON.parse(pendingGenerationJson)
      const { quizId } = pendingGeneration
      
      await kv.hset(quizId, { 
        status: "erro",
        erro: "Falha ao gerar questões. Entre em contato com o administrador."
      })
      
      console.log(`Quiz ${quizId} marcado com status de erro`)
    } catch (innerError) {
      console.error("Erro ao marcar quiz com status de erro:", innerError)
    }
    
    return { status: "error", message: "Erro ao processar geração" }
  }
}

export async function GET(request: NextRequest) {
  // Extrai o token de segurança da query string (opcional)
  const searchParams = request.nextUrl.searchParams
  const apiKey = searchParams.get('key')
  
  // Se você definiu uma chave de API no .env, verifique-a aqui
  const expectedApiKey = process.env.QUIZ_GENERATOR_API_KEY
  if (expectedApiKey && apiKey !== expectedApiKey) {
    return NextResponse.json({ 
      success: false, 
      error: "Acesso não autorizado" 
    }, { status: 401 })
  }
  
  try {
    const result = await processGenerationQueue()
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error("Erro ao processar fila:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Falha ao processar fila" 
    }, { status: 500 })
  }
} 
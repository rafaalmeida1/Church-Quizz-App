import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import type { Question } from "./types"

export async function generateQuizQuestions(tema: string, tipo: "adulto" | "crianca"): Promise<Question[]> {
  const faixaEtaria = tipo === "adulto" ? "adultos" : "crianças"

  const prompt = `
    Crie EXATAMENTE 15 questões de múltipla escolha sobre o tema de catecismo católico: "${tema}".
    Estas questões são para ${faixaEtaria} e DEVEM ser em Português do Brasil.
    
    Cada questão deve ter 4 opções com apenas uma resposta correta.
    
    Formate sua resposta como um array JSON com a seguinte estrutura:
    [
      {
        "id": "1",
        "texto": "Texto da pergunta aqui?",
        "opcoes": ["Opção A", "Opção B", "Opção C", "Opção D"],
        "opcaoCorreta": 0 // Índice da opção correta (0-3)
      }
    ]
    
    IMPORTANTE:
    1. DEVE ter exatamente 15 questões, nem mais nem menos.
    2. As questões DEVEM estar totalmente em Português do Brasil.
    3. Certifique-se de que as questões sejam apropriadas para ${faixaEtaria} e cubram vários aspectos do tema.
    4. Para crianças, use linguagem e conceitos mais simples.
    5. Para adultos, você pode incluir mais profundidade teológica e complexidade.
  `

  try {
    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt,
    })

    // Limpa a resposta removendo markdown e espaços extras
    const cleanText = text.replace(/```json\n?|\n?```/g, "").trim()

    // Analisa a resposta e garante que esteja no formato correto
    const questoes = JSON.parse(cleanText) as Question[]

    // Valida e limpa as questões
    const validatedQuestions = questoes.slice(0, 15).map((q, index) => ({
      id: (index + 1).toString(),
      texto: q.texto,
      opcoes: q.opcoes.slice(0, 4), // Garante exatamente 4 opções
      opcaoCorreta: q.opcaoCorreta >= 0 && q.opcaoCorreta <= 3 ? q.opcaoCorreta : 0,
    }))

    if (validatedQuestions.length < 15) {
      throw new Error("O modelo AI não gerou 15 questões como solicitado")
    }

    return validatedQuestions
  } catch (error) {
    console.error("Erro ao gerar questões do quiz:", error)
    throw new Error("Falha ao gerar questões do quiz")
  }
}

import { type Metadata } from "next"
import QuizClient from "./quiz-client"

type QuizPageProps = {
  params: {
    id: string
  }
}

export const metadata: Metadata = {
  title: "Quiz",
  description: "Responda o quiz e ganhe pontos",
}

export default async function QuizPage({ params }: QuizPageProps) {
  // Extrair o ID do quiz do parâmetro da rota
  const quizId = await params.id as string
  
  return <QuizClient quizId={quizId} />
}

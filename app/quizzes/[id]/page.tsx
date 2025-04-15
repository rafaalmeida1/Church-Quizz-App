import { type Metadata } from "next"
import QuizClient from "./quiz-client"
import { notFound, redirect } from "next/navigation"

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
  // Check if someone is trying to access /quizzes/create through this route
  if (params.id === 'create') {
    // Redirect to the proper create page
    redirect('/quizzes/create')
    return null
  }
  
  // Extract the quiz ID from the route parameter
  const quizId = params.id
  
  // Make sure we have a valid quiz ID format
  if (!quizId || quizId === 'undefined') {
    notFound()
  }
  
  return <QuizClient quizId={quizId} />
}

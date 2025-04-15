import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { 
  getParishQuizzes, 
  getParish, 
  getQuizResponses,
  getQuizzesByType
} from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SkeletonCard, LoadingDots, Spinner } from "@/components/ui/loading"

import { BookOpen, Star, Timer, CheckCircle2, Plus, TrendingUp, Award, Flame, ClipboardCheck, AlertCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import QuizzesClient from "./quizzes-client"

export default async function QuizzesPage() {
  const { user, parishId } = await getSession()

  if (!user) {
    redirect("/login")
  }

  const parish = await getParish(parishId!)
  
  const quizzes = user.tipo 
    ? await getQuizzesByType(parishId!, user.tipo)
    : await getParishQuizzes(parishId!)
  
  const activeQuizzes = quizzes
    .filter(quiz => quiz.status === "ativo" && quiz.expiraEm > Date.now())
    .sort((a, b) => b.criadoEm - a.criadoEm)
  
  const pendingQuizzes = quizzes
    .filter(quiz => quiz.status === "pendente")
    .sort((a, b) => b.criadoEm - a.criadoEm)
  
  const generatingQuizzes = quizzes
    .filter(quiz => quiz.status === "gerando")
    .sort((a, b) => b.criadoEm - a.criadoEm)
  
  const errorQuizzes = quizzes
    .filter(quiz => quiz.status === "erro")
    .sort((a, b) => b.criadoEm - a.criadoEm)
  
  const completedQuizzes = quizzes
    .filter(quiz => quiz.status === "encerrado" || quiz.expiraEm <= Date.now())
    .sort((a, b) => b.criadoEm - a.criadoEm)
  
  const quizzesWithResponses = await Promise.all(
    quizzes.map(async (quiz) => {
      const responses = await getQuizResponses(quiz.id!)
      const userResponse = responses.find(r => r.userId === user.id)
      
      const isExpired = quiz.expiraEm < Date.now()
      const status = isExpired ? "expirado" : quiz.status
      
      return {
        ...quiz,
        userHasCompleted: !!userResponse,
        score: userResponse?.pontuacao || 0,
        status,
      }
    })
  )
  
  const userCompletedQuizzes = quizzesWithResponses.filter(q => q.userHasCompleted)
  const averageScore = userCompletedQuizzes.length > 0 
    ? Math.round(userCompletedQuizzes.reduce((sum, q) => sum + q.score, 0) / userCompletedQuizzes.length)
    : 0
  
  const suggestedQuiz = quizzesWithResponses
    .find(q => !q.userHasCompleted && q.status === "ativo")

  return (
    <QuizzesClient 
      user={user} 
      parish={parish} 
      activeQuizzes={activeQuizzes}
      pendingQuizzes={pendingQuizzes}
      generatingQuizzes={generatingQuizzes}
      errorQuizzes={errorQuizzes}
      completedQuizzes={completedQuizzes}
      quizzesWithResponses={quizzesWithResponses}
      userCompletedQuizzes={userCompletedQuizzes}
      averageScore={averageScore}
      suggestedQuiz={suggestedQuiz}
    />
  )
}

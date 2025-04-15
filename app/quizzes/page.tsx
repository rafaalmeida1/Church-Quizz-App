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
import { Quiz } from "@/lib/types"

import { BookOpen, Star, Timer, CheckCircle2, Plus, TrendingUp, Award, Flame, ClipboardCheck, AlertCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import QuizzesClient from "./quizzes-client"

export default async function QuizzesPage() {
  try {
    const { user, parishId } = await getSession();

    if (!user) {
      redirect("/login");
    }

    if (!parishId) {
      console.error("No parishId found for user");
      redirect("/dashboard?error=no-parish");
    }

    let parish = null;
    try {
      parish = await getParish(parishId);
    } catch (error) {
      console.error("Error fetching parish:", error);
    }
    
    // Get quizzes with null safety
    let quizzes: Quiz[] = [];
    try {
      quizzes = user.tipo 
        ? await getQuizzesByType(parishId, user.tipo)
        : await getParishQuizzes(parishId);
        
      // Ensure quizzes is always an array
      if (!quizzes || !Array.isArray(quizzes)) {
        console.warn("Quizzes is not an array, using empty array instead");
        quizzes = [];
      }
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      quizzes = [];
    }
    
    // Apply filters safely with null checks
    const activeQuizzes = Array.isArray(quizzes) 
      ? quizzes
          .filter(quiz => quiz && quiz.status === "ativo" && quiz.expiraEm && quiz.expiraEm > Date.now())
          .sort((a, b) => (b.criadoEm || 0) - (a.criadoEm || 0))
      : [];
    
    const pendingQuizzes = Array.isArray(quizzes)
      ? quizzes
          .filter(quiz => quiz && quiz.status === "pendente")
          .sort((a, b) => (b.criadoEm || 0) - (a.criadoEm || 0))
      : [];
    
    const generatingQuizzes = Array.isArray(quizzes)
      ? quizzes
          .filter(quiz => quiz && quiz.status === "gerando")
          .sort((a, b) => (b.criadoEm || 0) - (a.criadoEm || 0))
      : [];
    
    const errorQuizzes = Array.isArray(quizzes)
      ? quizzes
          .filter(quiz => quiz && quiz.status === "erro")
          .sort((a, b) => (b.criadoEm || 0) - (a.criadoEm || 0))
      : [];
    
    const completedQuizzes = Array.isArray(quizzes)
      ? quizzes
          .filter(quiz => quiz && (quiz.status === "encerrado" || (quiz.expiraEm && quiz.expiraEm <= Date.now())))
          .sort((a, b) => (b.criadoEm || 0) - (a.criadoEm || 0))
      : [];
    
    // Process quiz responses more safely
    let quizzesWithResponses: Record<string, any>[] = [];
    try {
      quizzesWithResponses = await Promise.all(
        quizzes.map(async (quiz) => {
          try {
            if (!quiz || !quiz.id) {
              return {
                id: "invalid-quiz",
                titulo: "Quiz inválido",
                status: "erro",
                userHasCompleted: false,
                score: 0
              };
            }
            
            const responses = await getQuizResponses(quiz.id) || [];
            const userResponse = Array.isArray(responses) 
              ? responses.find(r => r && r.userId === user.id)
              : null;
            
            const expiraEm = quiz.expiraEm || Date.now();
            const isExpired = expiraEm < Date.now();
            const status = isExpired ? "expirado" : (quiz.status || "desconhecido");
            
            return {
              ...quiz,
              userHasCompleted: !!userResponse,
              score: userResponse?.pontuacao || 0,
              status,
            };
          } catch (error) {
            console.error(`Error processing quiz ${quiz?.id}:`, error);
            return {
              ...quiz,
              userHasCompleted: false,
              score: 0,
              status: "erro",
            };
          }
        })
      );
    } catch (error) {
      console.error("Error processing quiz responses:", error);
    }
    
    // Ensure we always have arrays for these variables
    quizzesWithResponses = Array.isArray(quizzesWithResponses) ? quizzesWithResponses : [];
    
    const userCompletedQuizzes = quizzesWithResponses.filter(q => q && q.userHasCompleted);
    const averageScore = userCompletedQuizzes.length > 0 
      ? Math.round(userCompletedQuizzes.reduce((sum, q) => sum + (q?.score || 0), 0) / userCompletedQuizzes.length)
      : 0;
    
    const suggestedQuiz = quizzesWithResponses
      .find(q => q && !q.userHasCompleted && q.status === "ativo");
    
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
    );
  } catch (error) {
    console.error("Error in QuizzesPage:", error);
    return <div className="container p-4">Erro ao carregar página de quizzes. Por favor, tente novamente.</div>;
  }
}

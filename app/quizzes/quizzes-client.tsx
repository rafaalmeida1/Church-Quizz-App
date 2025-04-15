"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SkeletonCard, LoadingDots, Spinner } from "@/components/ui/loading"
import { BookOpen, Star, Timer, CheckCircle2, Plus, TrendingUp, Award, Flame, ClipboardCheck, AlertCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { User, Parish, Quiz } from "@/lib/types"

interface QuizzesClientProps {
  user: User;
  parish: Parish;
  activeQuizzes: Quiz[];
  pendingQuizzes: Quiz[];
  generatingQuizzes: Quiz[];
  errorQuizzes: Quiz[];
  completedQuizzes: Quiz[];
  quizzesWithResponses: any[];
  userCompletedQuizzes: any[];
  averageScore: number;
  suggestedQuiz: any;
}

export default function QuizzesClient({
  user,
  parish,
  activeQuizzes,
  pendingQuizzes,
  generatingQuizzes,
  errorQuizzes,
  completedQuizzes,
  quizzesWithResponses,
  userCompletedQuizzes,
  averageScore,
  suggestedQuiz
}: QuizzesClientProps) {
  const getBadgeStyle = (score: number) => {
    if (score >= 90) return "badge-success";
    if (score >= 70) return "badge-warning";
    return "badge-destructive";
  };
  
  const [deletingQuizId, setDeletingQuizId] = useState<string | null>(null);
  
  async function handleDeleteQuiz(quizId: string) {
    if (!confirm("Tem certeza que deseja excluir este quiz?")) {
      return;
    }
    
    setDeletingQuizId(quizId);
    
    try {
      const response = await fetch(`/api/quizzes/${quizId}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        // Recarregar a página após excluir
        window.location.reload();
      } else {
        alert("Erro ao excluir o quiz. Tente novamente.");
      }
    } catch (error) {
      console.error("Erro ao excluir quiz:", error);
      alert("Erro ao excluir o quiz. Tente novamente.");
    } finally {
      setDeletingQuizId(null);
    }
  }
  
  return (
    <div className="container py-6 pb-24 md:pb-6 max-w-5xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold font-cinzel text-primary">Quizzes</h1>
          <p className="text-muted-foreground mt-1">
            Teste seus conhecimentos sobre a fé católica
          </p>
        </div>
        
        {user.role === "catequista" && (
          <Button asChild className="btn-catholic">
            <Link href="/quizzes/create" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span>Criar novo Quiz</span>
            </Link>
          </Button>
        )}
      </div>
      
      <div className="mb-8 animate-reveal">
        <Card className="overflow-hidden card-vitral">
          <CardContent className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
              <div className="p-6 flex flex-col items-center text-center">
                <div className="bg-primary/10 rounded-full p-3 mb-3">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">{userCompletedQuizzes.length}</h3>
                <p className="text-sm text-muted-foreground">Quizzes Completados</p>
              </div>
              
              <div className="p-6 flex flex-col items-center text-center">
                <div className="bg-accent/10 rounded-full p-3 mb-3">
                  <Star className="h-6 w-6 text-accent" />
                </div>
                <h3 className="text-2xl font-bold">{averageScore}%</h3>
                <p className="text-sm text-muted-foreground">Pontuação Média</p>
              </div>
              
              <div className="p-6 flex flex-col items-center text-center">
                <div className="bg-success/10 rounded-full p-3 mb-3">
                  <Flame className="h-6 w-6 text-success" />
                </div>
                <h3 className="text-2xl font-bold">{activeQuizzes.length}</h3>
                <p className="text-sm text-muted-foreground">Quizzes Disponíveis</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
            
      {suggestedQuiz && (
        <div className="mb-8 animate-reveal">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span>Quiz Recomendado</span>
          </h2>
          
          <Card className="overflow-hidden quiz-card pulse-attention">
            <div className="relative">
              <div className="bg-gradient-to-r from-primary to-secondary h-3 w-full" />
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <Badge className="badge-duolingo mb-2">
                      {suggestedQuiz.tipo === "adulto" ? "Adultos" : "Crianças"}
                    </Badge>
                    <h3 className="text-xl font-bold mb-1">{suggestedQuiz.titulo}</h3>
                    <p className="text-muted-foreground text-sm mb-4">{suggestedQuiz.descricao}</p>
                  </div>
                  <div className="bg-primary/10 rounded-full p-3">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-2">
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Timer className="h-4 w-4" />
                    <span>Expira em {formatDistanceToNow(suggestedQuiz.expiraEm, { 
                      locale: ptBR, 
                      addSuffix: true 
                    })}</span>
                  </div>
                  
                  <Button asChild className="btn-catholic">
                    <Link href={`/quizzes/${suggestedQuiz.id}`}>
                      Iniciar Agora
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
      
      <Tabs defaultValue="ativos" className="animate-reveal">
        <TabsList className="mb-6">
          <TabsTrigger value="ativos" className="rounded-full">Disponíveis</TabsTrigger>
          <TabsTrigger value="completados" className="rounded-full">Completados</TabsTrigger>
          {user.role === "catequista" && (
            <>
              <TabsTrigger value="pendentes" className="rounded-full">Pendentes</TabsTrigger>
              <TabsTrigger value="gerando" className="rounded-full">Em Geração</TabsTrigger>
              {errorQuizzes.length > 0 && (
                <TabsTrigger value="erros" className="rounded-full">Com Erros</TabsTrigger>
              )}
            </>
          )}
        </TabsList>
        
        <TabsContent value="ativos">
          {activeQuizzes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeQuizzes.map((quiz) => {
                const quizWithResponse = quizzesWithResponses.find(q => q.id === quiz.id)
                const hasCompleted = quizWithResponse?.userHasCompleted
                
                return (
                  <Card key={quiz.id} className={`overflow-hidden quiz-card ${!hasCompleted ? 'hover:shadow-lg' : 'opacity-90'}`}>
                    <div className="relative">
                      <div className={`h-3 w-full ${hasCompleted ? 'bg-success' : 'bg-gradient-to-r from-primary to-accent'}`} />
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <Badge className="badge-duolingo mb-2">
                              {quiz.tipo === "adulto" ? "Adultos" : "Crianças"}
                            </Badge>
                            <h3 className="text-xl font-bold mb-1">{quiz.titulo}</h3>
                            <p className="text-muted-foreground text-sm mb-4">{quiz.descricao}</p>
                          </div>
                          {hasCompleted ? (
                            <div className="bg-success/10 rounded-full p-3">
                              <CheckCircle2 className="h-6 w-6 text-success" />
                            </div>
                          ) : (
                            <div className="bg-primary/10 rounded-full p-3">
                              <BookOpen className="h-6 w-6 text-primary" />
                            </div>
                          )}
                        </div>
                        
                        <div className="text-sm text-muted-foreground flex items-center gap-2 mt-2 mb-4">
                          <Timer className="h-4 w-4" />
                          <span>Expira em {formatDistanceToNow(quiz.expiraEm, { 
                            locale: ptBR, 
                            addSuffix: true 
                          })}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div>
                              <p className="text-sm text-muted-foreground">Questões</p>
                              <p className="font-bold">{quiz.questoes.length}</p>
                            </div>
                            
                            {hasCompleted && (
                              <div className="ml-6">
                                <p className="text-sm text-muted-foreground">Pontuação</p>
                                <Badge className={`${getBadgeStyle(quizWithResponse?.score || 0)}`}>
                                  {quizWithResponse?.score || 0}%
                                </Badge>
                              </div>
                            )}
                          </div>
                          
                          <Button 
                            asChild 
                            className={hasCompleted ? "bg-muted hover:bg-muted" : "btn-catholic"}
                          >
                            <Link href={`/quizzes/${quiz.id}`}>
                              {hasCompleted ? 'Refazer' : 'Iniciar'}
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-10 bg-muted/20 rounded-xl border border-border">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum quiz disponível</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                No momento, não existem quizzes ativos disponíveis para você.
                Verifique novamente mais tarde.
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="completados">
          {userCompletedQuizzes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {userCompletedQuizzes.map((quiz) => (
                <Card key={quiz.id} className="overflow-hidden quiz-card">
                  <div className="relative">
                    <div className={`h-3 w-full bg-gradient-to-r ${
                      quiz.score >= 90 ? 'from-green-400 to-green-500' :
                      quiz.score >= 70 ? 'from-amber-400 to-amber-500' :
                      'from-red-400 to-red-500'
                    }`} />
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <Badge className="badge-duolingo mb-2">
                            {quiz.tipo === "adulto" ? "Adultos" : "Crianças"}
                          </Badge>
                          <h3 className="text-xl font-bold mb-1">{quiz.titulo}</h3>
                          <p className="text-muted-foreground text-sm">{quiz.descricao}</p>
                        </div>
                        <div className={`rounded-full p-3 ${
                          quiz.score >= 90 ? 'bg-success/10' :
                          quiz.score >= 70 ? 'bg-warning/10' :
                          'bg-destructive/10'
                        }`}>
                          <Award className={`h-6 w-6 ${
                            quiz.score >= 90 ? 'text-success' :
                            quiz.score >= 70 ? 'text-warning' :
                            'text-destructive'
                          }`} />
                        </div>
                      </div>
                      
                      <div className="mt-4 mb-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">Pontuação</span>
                          <span className="text-sm font-bold">{quiz.score}%</span>
                        </div>
                        <div className="progress-duolingo">
                          <div 
                            className="progress-duolingo-bar" 
                            style={{ width: `${quiz.score}%` }}
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          {quiz.status === "expirado" ? (
                            <span className="text-destructive">Expirado</span>
                          ) : (
                            <span>Completo</span>
                          )}
                        </div>
                        <Button asChild variant="outline">
                          <Link href={`/quizzes/${quiz.id}`}>
                            Ver Resultados
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-muted/20 rounded-xl border border-border">
              <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum quiz completado</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Você ainda não completou nenhum quiz. Complete quizzes para
                acompanhar seu progresso aqui.
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="pendentes">
          {pendingQuizzes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pendingQuizzes.map((quiz) => (
                <Card key={quiz.id} className="overflow-hidden quiz-card">
                  <div className="relative">
                    <div className="h-3 w-full bg-muted" />
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <Badge variant="outline" className="mb-2">
                            {quiz.tipo === "adulto" ? "Adultos" : "Crianças"}
                          </Badge>
                          <h3 className="text-xl font-bold mb-1">{quiz.titulo}</h3>
                          <p className="text-muted-foreground text-sm">{quiz.descricao}</p>
                        </div>
                        <div className="bg-muted/50 rounded-full p-3">
                          <Timer className="h-6 w-6 text-muted-foreground" />
                        </div>
                      </div>
                      
                      <div className="mt-4 mb-4">
                        <p className="text-sm text-muted-foreground">
                          Criado em {new Date(quiz.criadoEm).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div>
                            <p className="text-sm text-muted-foreground">Questões</p>
                            <p className="font-bold">{quiz.questoes.length}</p>
                          </div>
                        </div>
                        
                        <Button asChild>
                          <Link href={`/quizzes/editar/${quiz.id}`}>
                            Editar
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-muted/20 rounded-xl border border-border">
              <ClipboardCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum quiz pendente</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Não há quizzes aguardando aprovação no momento.
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="gerando">
          {generatingQuizzes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {generatingQuizzes.map((quiz) => (
                <Card key={quiz.id} className="overflow-hidden quiz-card pulse-attention">
                  <div className="relative">
                    <div className="bg-gradient-to-r from-blue-400 to-purple-500 h-3 w-full" />
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <Badge className="badge-duolingo mb-2">
                            {quiz.tipo === "adulto" ? "Adultos" : "Crianças"}
                          </Badge>
                          <h3 className="text-xl font-bold mb-1">{quiz.titulo}</h3>
                          <p className="text-muted-foreground text-sm mb-4">{quiz.descricao}</p>
                        </div>
                        <div className="bg-blue-500/10 rounded-full p-3">
                          <LoadingDots />
                        </div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground flex items-center gap-2 mt-2 mb-4">
                        <Timer className="h-4 w-4" />
                        <span>Criado há {formatDistanceToNow(quiz.criadoEm, { locale: ptBR })}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="text-sm text-muted-foreground">Status</p>
                            <p className="font-bold">Gerando Questões</p>
                          </div>
                        </div>
                        
                        <Button 
                          variant="outline"
                          onClick={() => window.location.reload()}
                        >
                          Verificar Status
                        </Button>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-muted/20 rounded-xl border border-border">
              <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum quiz em geração</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Não há quizzes sendo gerados no momento.
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="erros">
          {errorQuizzes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {errorQuizzes.map((quiz) => (
                <Card key={quiz.id} className="overflow-hidden quiz-card">
                  <div className="relative">
                    <div className="bg-red-500 h-3 w-full" />
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <Badge className="badge-duolingo mb-2 bg-red-100 text-red-700 border-red-200">
                            {quiz.tipo === "adulto" ? "Adultos" : "Crianças"}
                          </Badge>
                          <h3 className="text-xl font-bold mb-1">{quiz.titulo}</h3>
                          <p className="text-muted-foreground text-sm mb-4">{quiz.descricao}</p>
                        </div>
                        <div className="bg-red-500/10 rounded-full p-3">
                          <AlertCircle className="h-6 w-6 text-red-500" />
                        </div>
                      </div>
                      
                      <div className="text-sm text-red-500 flex items-center gap-2 mt-2 mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <span>{quiz.erro || "Erro na geração do quiz"}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="text-sm text-muted-foreground">Criado em</p>
                            <p className="font-bold">{new Date(quiz.criadoEm).toLocaleDateString('pt-BR')}</p>
                          </div>
                        </div>
                        
                        <Button 
                          variant="destructive"
                          onClick={() => handleDeleteQuiz(quiz.id!)}
                          disabled={deletingQuizId === quiz.id}
                        >
                          {deletingQuizId === quiz.id ? <Spinner size="small" /> : "Excluir Quiz"}
                        </Button>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-muted/20 rounded-xl border border-border">
              <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Sem erros</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Não há quizzes com erros no momento.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
} 
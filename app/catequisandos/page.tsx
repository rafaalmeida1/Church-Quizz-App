import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { 
  getParishCatequisandos, 
  getUserQuizResponses, 
  getQuiz
} from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { 
  UserRound, 
  BookOpen, 
  Award, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  BarChart3,
  Trophy
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

export default async function CatequisandosPage() {
  const { user, parishId } = await getSession()

  // Verificar se o usuário está logado e é catequista
  if (!user || user.role !== "catequista") {
    redirect("/dashboard")
  }

  // Buscar catequisandos da paróquia
  const catequisandos = await getParishCatequisandos(parishId!)
  
  // Obter estatísticas para cada catequisando
  const catequisandosComEstatisticas = await Promise.all(
    catequisandos.map(async (catequisando) => {
      // Obter todas as respostas de quiz do catequisando
      const responses = await getUserQuizResponses(catequisando.id!)
      
      // Calcular estatísticas
      const totalQuizzes = responses.length
      const totalPontuacao = responses.reduce((sum, response) => sum + response.pontuacao, 0)
      const pontuacaoMedia = totalQuizzes > 0 ? Math.round(totalPontuacao / totalQuizzes) : 0
      
      // Buscar os 3 últimos quizzes respondidos com detalhes
      const ultimosQuizzes = await Promise.all(
        responses
          .sort((a, b) => b.completadoEm - a.completadoEm)
          .slice(0, 3)
          .map(async (response) => {
            const quiz = await getQuiz(response.quizId)
            return {
              id: response.quizId,
              titulo: quiz?.titulo || "Quiz não encontrado",
              pontuacao: response.pontuacao,
              completadoEm: response.completadoEm,
              respostasCorretas: response.respostas.filter(r => r.estaCorreta).length,
              totalQuestoes: response.respostas.length
            }
          })
      )
      
      return {
        ...catequisando,
        estatisticas: {
          totalQuizzes,
          pontuacaoMedia,
          ultimosQuizzes
        }
      }
    })
  )
  
  // Ordenar os catequisandos por pontuação média (ranking)
  const catequisandosRanking = [...catequisandosComEstatisticas]
    .sort((a, b) => b.estatisticas.pontuacaoMedia - a.estatisticas.pontuacaoMedia)
  
  return (
    <div className="container py-6 pb-24 md:pb-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold font-cinzel text-primary">Meus Catequisandos</h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe o progresso e desempenho dos catequisandos
          </p>
        </div>
        <Badge className="bg-primary">Total: {catequisandos.length}</Badge>
      </div>
      
      <Tabs defaultValue="todos" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="ranking">Ranking</TabsTrigger>
          <TabsTrigger value="tipo">Por Catequese</TabsTrigger>
        </TabsList>
        
        <TabsContent value="todos" className="space-y-6">
          {catequisandosComEstatisticas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {catequisandosComEstatisticas.map((catequisando) => (
                <Card key={catequisando.id} className="overflow-hidden card-vitral">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 bg-primary/10 border-2 border-primary/20">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {catequisando.nome.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{catequisando.nome}</CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <UserRound className="h-3 w-3" />
                          {catequisando.email}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-primary/5 rounded-md p-3 text-center">
                        <div className="text-primary text-2xl font-bold">
                          {catequisando.estatisticas.totalQuizzes}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">Quizzes Completados</div>
                      </div>
                      
                      <div className="bg-accent/5 rounded-md p-3 text-center">
                        <div className="text-accent text-2xl font-bold">
                          {catequisando.estatisticas.pontuacaoMedia}%
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">Pontuação Média</div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                        <Clock className="h-4 w-4" /> Atividade Recente
                      </h4>
                      
                      {catequisando.estatisticas.ultimosQuizzes.length > 0 ? (
                        <div className="space-y-3">
                          {catequisando.estatisticas.ultimosQuizzes.map((quiz, index) => (
                            <div key={index} className="bg-background rounded-md p-2 text-sm">
                              <div className="flex justify-between mb-1">
                                <span className="font-medium">{quiz.titulo}</span>
                                <Badge variant={quiz.pontuacao >= 70 ? "default" : "destructive"} className="text-xs">
                                  {quiz.pontuacao}%
                                </Badge>
                              </div>
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>
                                  {quiz.respostasCorretas}/{quiz.totalQuestoes} corretas
                                </span>
                                <span>
                                  {formatDistanceToNow(quiz.completadoEm, { locale: ptBR, addSuffix: true })}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground italic">
                          Nenhum quiz completado ainda
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 bg-muted/20 rounded-lg border border-border">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum catequisando encontrado</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Não existem catequisandos registrados sob sua supervisão.
                Você pode convidar novos catequisandos através do menu "Convites".
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="ranking" className="space-y-6">
          <Card className="card-vitral">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-accent" /> Ranking de Desempenho
              </CardTitle>
              <CardDescription>
                Classificação dos catequisandos com base na pontuação média obtida nos quizzes
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {catequisandosRanking.length > 0 ? (
                <div className="space-y-4">
                  {catequisandosRanking.map((catequisando, index) => (
                    <div key={catequisando.id} className="flex items-center gap-4">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? "bg-yellow-100 text-yellow-700 border-2 border-yellow-300" :
                        index === 1 ? "bg-gray-100 text-gray-700 border-2 border-gray-300" :
                        index === 2 ? "bg-amber-100 text-amber-700 border-2 border-amber-300" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {index + 1}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-medium">{catequisando.nome}</div>
                          <div className="font-bold text-primary">
                            {catequisando.estatisticas.pontuacaoMedia}%
                          </div>
                        </div>
                        
                        <Progress 
                          value={catequisando.estatisticas.pontuacaoMedia} 
                          className="h-2" 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-4 text-muted-foreground">
                  Não há dados suficientes para exibir o ranking
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="tipo" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="card-vitral">
              <CardHeader>
                <CardTitle>Catequese para Crianças</CardTitle>
                <CardDescription>
                  Catequisandos inscritos na catequese infantil
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {catequisandosComEstatisticas.filter(c => c.tipo === "crianca").length > 0 ? (
                  <div className="space-y-4">
                    {catequisandosComEstatisticas
                      .filter(c => c.tipo === "crianca")
                      .map((catequisando) => (
                        <div key={catequisando.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/5">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/20 text-primary">
                              {catequisando.nome.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1">
                            <div className="font-medium">{catequisando.nome}</div>
                            <div className="text-xs text-muted-foreground">
                              {catequisando.estatisticas.totalQuizzes} quizzes • {catequisando.estatisticas.pontuacaoMedia}% média
                            </div>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                ) : (
                  <div className="text-center p-4 text-muted-foreground">
                    Nenhum catequisando na catequese infantil
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="card-vitral">
              <CardHeader>
                <CardTitle>Catequese para Adultos</CardTitle>
                <CardDescription>
                  Catequisandos inscritos na catequese para adultos
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {catequisandosComEstatisticas.filter(c => c.tipo === "adulto").length > 0 ? (
                  <div className="space-y-4">
                    {catequisandosComEstatisticas
                      .filter(c => c.tipo === "adulto")
                      .map((catequisando) => (
                        <div key={catequisando.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/5">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-secondary/20 text-secondary">
                              {catequisando.nome.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1">
                            <div className="font-medium">{catequisando.nome}</div>
                            <div className="text-xs text-muted-foreground">
                              {catequisando.estatisticas.totalQuizzes} quizzes • {catequisando.estatisticas.pontuacaoMedia}% média
                            </div>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                ) : (
                  <div className="text-center p-4 text-muted-foreground">
                    Nenhum catequisando na catequese para adultos
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 
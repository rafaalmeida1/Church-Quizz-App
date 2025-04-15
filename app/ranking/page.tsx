import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { 
  getParishUsers, 
  getUserQuizResponses, 
  getParishQuizzes,
  getParish
} from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { 
  Trophy, 
  Medal, 
  Flame, 
  Star, 
  BarChart4, 
  Users,
  BookOpen,
  CheckCircle,
  Calendar
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default async function RankingPage() {
  const { user, parishId } = await getSession()

  // Verificar se o usuário está logado
  if (!user) {
    redirect("/login")
  }

  // Buscar informações da paróquia
  const parish = await getParish(parishId!)
  
  // Buscar usuários da paróquia
  const usuarios = await getParishUsers(parishId!)
  
  // Filtrar apenas catequistas e catequisandos
  const usuariosFiltrados = usuarios.filter(u => u.role === "catequista" || u.role === "catequisando")
  
  // Buscar quizzes da paróquia
  const quizzes = await getParishQuizzes(parishId!)
  
  // Obter estatísticas para cada usuário
  const usuariosComEstatisticas = await Promise.all(
    usuariosFiltrados.map(async (usuario) => {
      // Obter todas as respostas de quiz do usuário
      const responses = await getUserQuizResponses(usuario.id!)
      
      // Calcular estatísticas
      const totalQuizzes = responses.length
      const totalPontuacao = responses.reduce((sum, response) => sum + response.pontuacao, 0)
      const pontuacaoMedia = totalQuizzes > 0 ? Math.round(totalPontuacao / totalQuizzes) : 0
      
      // Pontuação mais alta
      const pontuacaoMaisAlta = responses.length > 0 
        ? Math.max(...responses.map(r => r.pontuacao))
        : 0
      
      // Total de respostas corretas
      const totalRespostas = responses.reduce((sum, r) => sum + r.respostas.length, 0)
      const respostasCorretas = responses.reduce(
        (sum, r) => sum + r.respostas.filter(a => a.estaCorreta).length, 
        0
      )
      const taxaAcertos = totalRespostas > 0 
        ? Math.round((respostasCorretas / totalRespostas) * 100) 
        : 0
      
      // Última atividade
      const ultimaAtividade = responses.length > 0
        ? Math.max(...responses.map(r => r.completadoEm))
        : null
      
      return {
        ...usuario,
        estatisticas: {
          totalQuizzes,
          pontuacaoMedia,
          pontuacaoMaisAlta,
          respostasCorretas,
          totalRespostas,
          taxaAcertos,
          ultimaAtividade
        }
      }
    })
  )
  
  // Diferentes rankings
  const rankingPontuacaoMedia = [...usuariosComEstatisticas]
    .sort((a, b) => b.estatisticas.pontuacaoMedia - a.estatisticas.pontuacaoMedia)
    .slice(0, 10)
  
  const rankingTotalQuizzes = [...usuariosComEstatisticas]
    .sort((a, b) => b.estatisticas.totalQuizzes - a.estatisticas.totalQuizzes)
    .slice(0, 10)
  
  const rankingTaxaAcertos = [...usuariosComEstatisticas]
    .sort((a, b) => b.estatisticas.taxaAcertos - a.estatisticas.taxaAcertos)
    .filter(u => u.estatisticas.totalRespostas > 0)
    .slice(0, 10)
    
  // Rankings por tipo de usuário
  const rankingCatequistas = [...usuariosComEstatisticas]
    .filter(u => u.role === "catequista")
    .sort((a, b) => b.estatisticas.pontuacaoMedia - a.estatisticas.pontuacaoMedia)
  
  const rankingCatequisandos = [...usuariosComEstatisticas]
    .filter(u => u.role === "catequisando")
    .sort((a, b) => b.estatisticas.pontuacaoMedia - a.estatisticas.pontuacaoMedia)
    
  // Estatísticas globais
  const totalUsuarios = usuariosFiltrados.length
  const totalCatequistas = usuariosFiltrados.filter(u => u.role === "catequista").length
  const totalCatequisandos = usuariosFiltrados.filter(u => u.role === "catequisando").length
  const totalRespostasQuiz = usuariosComEstatisticas.reduce(
    (sum, u) => sum + u.estatisticas.totalQuizzes, 
    0
  )
  
  // Função auxiliar para medalhas
  const getMedalClassName = (position: number) => {
    switch (position) {
      case 0: return "bg-yellow-100 text-yellow-700 border-2 border-yellow-300";
      case 1: return "bg-gray-100 text-gray-700 border-2 border-gray-300";
      case 2: return "bg-amber-100 text-amber-700 border-2 border-amber-300";
      default: return "bg-muted text-muted-foreground";
    }
  };
  
  return (
    <div className="container py-6 pb-24 md:pb-6 max-w-5xl">
      <div className="flex flex-col space-y-2 md:flex-row md:justify-between md:space-y-0 items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold font-cinzel text-primary flex items-center gap-2">
            <Trophy className="h-7 w-7 text-accent" /> Ranking da Paróquia
          </h1>
          <p className="text-muted-foreground mt-1">
            {parish?.nome || "Paróquia"} - Classificação e estatísticas dos participantes
          </p>
        </div>
        
        <div className="flex gap-4 flex-wrap justify-center">
          <div className="text-center">
            <div className="text-lg font-bold text-primary">{totalUsuarios}</div>
            <div className="text-xs text-muted-foreground">Participantes</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-primary">{quizzes.length}</div>
            <div className="text-xs text-muted-foreground">Quizzes</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-primary">{totalRespostasQuiz}</div>
            <div className="text-xs text-muted-foreground">Respostas</div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-yellow-50 to-white border border-yellow-100">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Medal className="h-5 w-5 text-yellow-600" /> Pontuação Média
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rankingPontuacaoMedia.length > 0 ? (
              <div className="space-y-3">
                {rankingPontuacaoMedia.slice(0, 3).map((usuario, index) => (
                  <div key={usuario.id} className="flex items-center gap-3">
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center text-sm font-bold ${getMedalClassName(index)}`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{usuario.nome}</div>
                        <div className="font-bold text-yellow-600">{usuario.estatisticas.pontuacaoMedia}%</div>
                      </div>
                      <Progress value={usuario.estatisticas.pontuacaoMedia} className="h-1.5 mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-2 text-sm text-muted-foreground">
                Sem dados disponíveis
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-50 to-white border border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Flame className="h-5 w-5 text-blue-600" /> Mais Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rankingTotalQuizzes.length > 0 ? (
              <div className="space-y-3">
                {rankingTotalQuizzes.slice(0, 3).map((usuario, index) => (
                  <div key={usuario.id} className="flex items-center gap-3">
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center text-sm font-bold ${getMedalClassName(index)}`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{usuario.nome}</div>
                        <div className="font-bold text-blue-600">{usuario.estatisticas.totalQuizzes}</div>
                      </div>
                      <Progress 
                        value={Math.min(usuario.estatisticas.totalQuizzes / Math.max(...rankingTotalQuizzes.map(u => u.estatisticas.totalQuizzes)) * 100, 100)} 
                        className="h-1.5 mt-1" 
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-2 text-sm text-muted-foreground">
                Sem dados disponíveis
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-white border border-green-100">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle className="h-5 w-5 text-green-600" /> Taxa de Acertos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rankingTaxaAcertos.length > 0 ? (
              <div className="space-y-3">
                {rankingTaxaAcertos.slice(0, 3).map((usuario, index) => (
                  <div key={usuario.id} className="flex items-center gap-3">
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center text-sm font-bold ${getMedalClassName(index)}`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{usuario.nome}</div>
                        <div className="font-bold text-green-600">{usuario.estatisticas.taxaAcertos}%</div>
                      </div>
                      <Progress value={usuario.estatisticas.taxaAcertos} className="h-1.5 mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-2 text-sm text-muted-foreground">
                Sem dados disponíveis
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="geral" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="geral">Ranking Geral</TabsTrigger>
          <TabsTrigger value="catequistas">Catequistas</TabsTrigger>
          <TabsTrigger value="catequisandos">Catequisandos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="geral" className="space-y-6">
          <Card className="card-vitral">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-accent" /> Top 10 - Melhores Pontuações
              </CardTitle>
              <CardDescription>
                Classificação baseada na pontuação média em todos os quizzes
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {rankingPontuacaoMedia.length > 0 ? (
                <div className="space-y-4">
                  {rankingPontuacaoMedia.map((usuario, index) => (
                    <div key={usuario.id} className="flex items-center gap-4">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${getMedalClassName(index)}`}>
                        {index + 1}
                      </div>
                      
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className={`
                          ${usuario.role === "catequista" ? "bg-primary/20 text-primary" : "bg-secondary/20 text-secondary"}
                        `}>
                          {usuario.nome.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{usuario.nome}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Badge variant="outline" className="text-[10px] py-0 px-1">
                                {usuario.role === "catequista" ? "Catequista" : "Catequisando"}
                              </Badge>
                              <span>•</span>
                              <span>{usuario.estatisticas.totalQuizzes} quizzes</span>
                            </div>
                          </div>
                          <div className="font-bold text-primary text-lg">
                            {usuario.estatisticas.pontuacaoMedia}%
                          </div>
                        </div>
                        
                        <Progress 
                          value={usuario.estatisticas.pontuacaoMedia} 
                          className="h-2 mt-1.5" 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 text-muted-foreground">
                  Não há dados suficientes para exibir o ranking
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="catequistas" className="space-y-6">
          <Card className="card-vitral">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" /> Ranking de Catequistas
              </CardTitle>
              <CardDescription>
                Desempenho dos catequistas nos quizzes da paróquia
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {rankingCatequistas.length > 0 ? (
                <div className="space-y-4">
                  {rankingCatequistas.map((catequista, index) => (
                    <div key={catequista.id} className="flex items-center gap-4">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${getMedalClassName(index)}`}>
                        {index + 1}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{catequista.nome}</div>
                            <div className="text-xs text-muted-foreground">
                              {catequista.estatisticas.totalQuizzes} quizzes • Taxa de acertos: {catequista.estatisticas.taxaAcertos}%
                            </div>
                          </div>
                          <div className="font-bold text-primary">
                            {catequista.estatisticas.pontuacaoMedia}%
                          </div>
                        </div>
                        
                        <Progress 
                          value={catequista.estatisticas.pontuacaoMedia} 
                          className="h-2 mt-1" 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 text-muted-foreground">
                  Nenhum catequista encontrado
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="catequisandos" className="space-y-6">
          <Card className="card-vitral">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-secondary" /> Ranking de Catequisandos
              </CardTitle>
              <CardDescription>
                Desempenho dos catequisandos nos quizzes da paróquia
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {rankingCatequisandos.length > 0 ? (
                <div className="space-y-4">
                  {rankingCatequisandos.map((catequisando, index) => (
                    <div key={catequisando.id} className="flex items-center gap-4">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${getMedalClassName(index)}`}>
                        {index + 1}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{catequisando.nome}</div>
                            <div className="text-xs text-muted-foreground">
                              {catequisando.estatisticas.totalQuizzes} quizzes • Taxa de acertos: {catequisando.estatisticas.taxaAcertos}%
                            </div>
                          </div>
                          <div className="font-bold text-secondary">
                            {catequisando.estatisticas.pontuacaoMedia}%
                          </div>
                        </div>
                        
                        <Progress 
                          value={catequisando.estatisticas.pontuacaoMedia} 
                          className="h-2 mt-1" 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 text-muted-foreground">
                  Nenhum catequisando encontrado
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 
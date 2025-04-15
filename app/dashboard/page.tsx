import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { 
  getParish, 
  getParishQuizzes, 
  getUserQuizResponses, 
  getPendingQuizzesForUser,
  updateExpiredQuizzes 
} from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Award, BookOpen, Flame, Star, Timer, Trophy } from "lucide-react"
import { LoadingDots, StatsCardSkeleton } from "@/components/ui/loading"
import { Suspense } from "react"
import Image from "next/image"

export default async function DashboardPage() {
  const { user, parishId } = await getSession()

  if (!user) {
    redirect("/login")
  }

  // Atualiza quizzes expirados
  if (parishId) {
    await updateExpiredQuizzes(parishId)
  }

  const parish = await getParish(parishId!)
  const quizzes = await getParishQuizzes(parishId!)
  const responses = await getUserQuizResponses(user.id!)
  const pendingQuizzes = await getPendingQuizzesForUser(user.id!)

  // Calcula estatísticas
  const completedQuizzes = responses.length
  const totalScore = responses.reduce((sum, response) => sum + response.pontuacao, 0)
  const averageScore = completedQuizzes > 0 ? Math.round(totalScore / completedQuizzes) : 0
  const bestScore = completedQuizzes > 0 ? Math.max(...responses.map(r => r.pontuacao)) : 0

  // Calcular XP e nível
  const xp = (completedQuizzes * 10) + (averageScore * completedQuizzes / 10)
  const level = getLevel(xp)
  const nextLevelXP = getLevelThreshold(level)
  
  // Quizzes ativos que o usuário ainda não respondeu
  const activeQuizzes = quizzes
    .filter(quiz => 
      quiz.status === "ativo" && 
      quiz.expiraEm > Date.now() &&
      !responses.some(r => r.quizId === quiz.id)
    )
    .sort((a, b) => b.criadoEm - a.criadoEm)

  // Determinar a mensagem de boas-vindas com base no horário
  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite"
  
  // Determinar cores de nivel baseado na pontuação
  const getLevelColor = (level: number) => {
    if (level >= 4) return "bg-gradient-to-r from-violet-500 to-purple-500";
    if (level >= 3) return "bg-gradient-to-r from-green-500 to-emerald-500";
    if (level >= 2) return "bg-gradient-to-r from-blue-500 to-cyan-500";
    return "bg-gradient-to-r from-amber-500 to-yellow-500";
  };

  return (
    <div className="container py-6 pb-24 md:pb-6 max-w-5xl">
      {/* Cabeçalho */}
      <div className="mb-6 animate-reveal">
        <Card className="overflow-hidden card-vitral">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-primary-foreground font-bold text-2xl">
                  {user.nome?.charAt(0) || "U"}
                </div>
              </div>
              <div className="flex-grow">
                <h1 className="text-2xl font-bold font-cinzel text-primary">
                  {greeting}, {user.nome?.split(' ')[0] || "Discípulo"}!
                </h1>
                <p className="text-muted-foreground">
                  {parish?.nome || "Paróquia"}
                </p>
              </div>
              <div className="hidden md:block">
                <Badge className="badge-duolingo bg-accent text-accent-foreground">
                  Nível {level}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Grade de cartões principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Suspense fallback={<StatsCardSkeleton />}>
          <StatsCard 
            icon={<BookOpen className="h-6 w-6 text-primary" />}
            title="Quiz"
            value={completedQuizzes}
            label="completados"
            bgClass="bg-primary/10"
          />
        </Suspense>
        
        <Suspense fallback={<StatsCardSkeleton />}>
          <StatsCard 
            icon={<Star className="h-6 w-6 text-accent" />}
            title="Pontuação Média"
            value={`${averageScore}%`}
            label="corretas"
            bgClass="bg-accent/10"
          />
        </Suspense>
        
        <Suspense fallback={<StatsCardSkeleton />}>
          <StatsCard 
            icon={<Trophy className="h-6 w-6 text-warning" />}
            title="Melhor Resultado"
            value={`${bestScore}%`}
            label="pontuação"
            bgClass="bg-warning/10"
          />
        </Suspense>
      </div>
      
      {/* Progresso do nível */}
      <div className="mb-8 animate-reveal">
        <Card className="overflow-hidden card-vitral">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-accent" />
                <span>Seu Progresso</span>
              </span>
              <Badge className="badge-duolingo bg-accent text-accent-foreground">
                Nível {level}
              </Badge>
            </CardTitle>
            <CardDescription>Continue respondendo quizzes para avançar</CardDescription>
          </CardHeader>
          
          <CardContent className="p-6">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">XP {xp}/{nextLevelXP}</span>
                <span className="text-sm font-medium">{Math.round((xp / nextLevelXP) * 100)}%</span>
              </div>
              <div className="progress-duolingo">
                <div 
                  className={`progress-duolingo-bar ${getLevelColor(level)}`}
                  style={{ width: `${Math.min(100, (xp / nextLevelXP) * 100)}%` }}
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-4">
              <Badge className={`badge-duolingo py-2 ${getLevelColor(1)}`}>
                Nível 1: Iniciante
              </Badge>
              <Badge className={`badge-duolingo py-2 ${getLevelColor(2)}`}>
                Nível 2: Aprendiz
              </Badge>
              <Badge className={`badge-duolingo py-2 ${getLevelColor(3)}`}>
                Nível 3: Discípulo
              </Badge>
              <Badge className={`badge-duolingo py-2 ${getLevelColor(4)}`}>
                Nível 4: Mestre
              </Badge>
            </div>
          </CardContent>
          
          <CardFooter className="border-t px-6 py-4 bg-muted/10">
            <Button asChild>
              <Link href="/quizzes">
                Continuar aprendendo
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* Seção de Quizzes Disponíveis */}
      <div className="mb-8 animate-reveal">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <span>Quizzes Disponíveis</span>
          </h2>
          <Button asChild variant="outline" size="sm">
            <Link href="/quizzes">Ver todos</Link>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activeQuizzes.length > 0 ? (
            activeQuizzes.slice(0, 2).map((quiz) => (
              <Card key={quiz.id} className="overflow-hidden quiz-card">
                <div className="relative">
                  <div className="bg-gradient-to-r from-primary to-accent h-3 w-full" />
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge className="badge-duolingo mb-2">
                          {quiz.tipo === "adulto" ? "Adultos" : "Crianças"}
                        </Badge>
                        <h3 className="text-xl font-bold mb-1">{quiz.titulo}</h3>
                        <p className="text-muted-foreground text-sm mb-4">{quiz.descricao}</p>
                      </div>
                      <div className="bg-primary/10 rounded-full p-3">
                        <BookOpen className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <Timer className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{quiz.questoes.length} questões</span>
                      </div>
                      <Button asChild>
                        <Link href={`/quizzes/${quiz.id}`}>
                          Iniciar
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-1 md:col-span-2 text-center py-10 bg-muted/20 rounded-xl border border-border">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum quiz disponível</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                No momento, não existem quizzes ativos disponíveis para você.
                Verifique novamente mais tarde.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Componente para cartões de estatísticas
function StatsCard({ 
  icon, 
  title, 
  value, 
  label, 
  bgClass 
}: { 
  icon: React.ReactNode; 
  title: string; 
  value: string | number; 
  label: string;
  bgClass: string;
}) {
  return (
    <Card className="animate-reveal">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={`${bgClass} p-3 rounded-full`}>
            {icon}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Determinar nível baseado em XP
function getLevel(xp: number) {
  if (xp >= 300) return 4; // Mestre
  if (xp >= 150) return 3; // Discípulo
  if (xp >= 50) return 2;  // Aprendiz
  return 1;                // Iniciante
}

// XP para o próximo nível
function getLevelThreshold(level: number) {
  if (level === 1) return 50;
  if (level === 2) return 150;
  if (level === 3) return 300;
  return 500; // Nível máximo é 4, mas definimos um valor maior para progressão
}

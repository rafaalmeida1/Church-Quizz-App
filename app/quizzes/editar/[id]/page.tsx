"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { LoadingButton } from "@/components/ui/loading-button"
import { getSession } from "@/lib/auth"
import { User, Quiz } from "@/lib/types"

export default function EditQuizPage({ params }: { params: { id: string } }) {
  const quizId = params.id
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [quiz, setQuiz] = useState<Quiz | null>(null)

  useEffect(() => {
    async function loadUserDataAndQuiz() {
      try {
        setIsLoading(true)
        // Carregar os dados do usuário
        const sessionResponse = await fetch("/api/session")
        const sessionData = await sessionResponse.json()

        if (!sessionData.success || !sessionData.user) {
          router.push("/login")
          return
        }

        setUser(sessionData.user)

        // Carregar os dados do quiz
        const quizResponse = await fetch(`/api/quizzes/${quizId}`)
        
        if (!quizResponse.ok) {
          setError("Quiz não encontrado")
          return
        }
        
        const quizData = await quizResponse.json()
        
        if (!quizData.success || !quizData.quiz) {
          setError("Falha ao carregar dados do quiz")
          return
        }
        
        setQuiz(quizData.quiz)
      } catch (err) {
        console.error("Erro ao carregar dados:", err)
        setError("Falha ao carregar dados")
      } finally {
        setIsLoading(false)
      }
    }

    loadUserDataAndQuiz()
  }, [quizId, router])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    
    if (!user || !quiz) {
      setError("Dados não disponíveis")
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      // Get form data
      const formData = new FormData(event.currentTarget)
      const titulo = formData.get("titulo") as string
      const descricao = formData.get("descricao") as string
      const tipo = formData.get("tipo") as "adulto" | "crianca"

      // Validate required fields
      if (!titulo || !descricao || !tipo) {
        setError("Todos os campos são obrigatórios")
        setIsSaving(false)
        return
      }

      // Enviar os dados via API
      const response = await fetch(`/api/quizzes/${quizId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          titulo,
          descricao,
          tipo
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      if (result.success) {
        // Redirecionar conforme o status do quiz
        if (quiz.status === "pendente") {
          router.push("/quizzes?tab=pendentes")
        } else if (quiz.status === "ativo") {
          router.push("/quizzes?tab=ativos") 
        } else {
          router.push("/quizzes")
        }
      } else {
        setError(result.error || "Falha ao atualizar quiz")
      }
    } catch (err) {
      console.error("Erro ao atualizar quiz:", err)
      setError(typeof err === 'object' && err !== null && 'message' in err 
        ? (err as Error).message 
        : "Falha ao atualizar quiz. Verifique sua conexão e tente novamente.")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container max-w-md mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>Carregando dados do quiz...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (error && !quiz) {
    return (
      <div className="container max-w-md mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>Erro</CardTitle>
            <CardDescription className="text-red-500">{error}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push("/quizzes")} className="w-full">
              Voltar para Quizzes
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="container max-w-md mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>Quiz não encontrado</CardTitle>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push("/quizzes")} className="w-full">
              Voltar para Quizzes
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Editar Quiz</h1>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Detalhes do Quiz</CardTitle>
            <CardDescription>Edite os detalhes do seu quiz</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm bg-red-100 border border-red-200 text-red-600 rounded-md">{error}</div>
            )}

            <div className="space-y-2">
              <Label htmlFor="titulo">Título do Quiz</Label>
              <Input 
                id="titulo" 
                name="titulo" 
                defaultValue={quiz.titulo}
                required 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                name="descricao"
                defaultValue={quiz.descricao}
                placeholder="Breve descrição do que este quiz aborda"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tema">Tema/Tópico</Label>
              <Textarea
                id="tema"
                name="tema"
                defaultValue={quiz.tema}
                disabled={true}
                className="bg-gray-100"
              />
              <p className="text-xs text-gray-500">
                O tema não pode ser alterado após a criação do quiz.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Quiz</Label>
              <RadioGroup defaultValue={quiz.tipo} name="tipo">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="adulto" id="adulto" />
                  <Label htmlFor="adulto">Catecismo para Adultos</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="crianca" id="crianca" />
                  <Label htmlFor="crianca">Catecismo para Crianças</Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row gap-3">
            <Button 
              type="button" 
              variant="outline" 
              className="w-full" 
              onClick={() => router.back()}
            >
              Cancelar
            </Button>
            <LoadingButton 
              type="submit" 
              className="w-full" 
              isLoading={isSaving} 
              loadingText="Salvando..."
            >
              Salvar Alterações
            </LoadingButton>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
} 
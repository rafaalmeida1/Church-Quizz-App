"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { AlertCircle, AlertTriangle, Loader2 } from "lucide-react"
import { LoadingButton } from "@/components/ui/loading-button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { createQuizAction } from "@/app/actions"
import { User } from "@/lib/types"

export default function CreateQuizPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [parishId, setParishId] = useState<string | null>(null)
  const [loadingStage, setLoadingStage] = useState<string>("")

  useEffect(() => {
    async function loadUserData() {
      try {
        console.log("Fetching user session data...")
        const response = await fetch("/api/session")
        const data = await response.json()
        console.log("Session data received:", data)

        if (!data.success || !data.user) {
          console.log("No user found in session, redirecting to login")
          router.push("/login")
          return
        }

        if (!data.parishId) {
          console.log("No parish ID found in session")
          setError("Você não está associado a uma paróquia")
          return
        }

        setUser(data.user)
        setParishId(data.parishId)
      } catch (err) {
        console.error("Erro ao carregar dados do usuário:", err)
        setError("Falha ao carregar dados do usuário")
      }
    }

    loadUserData()
  }, [router])

  async function handleSubmit(formData: FormData) {
    if (!user || !parishId) {
      setError("Dados do usuário não disponíveis")
      return
    }

    // Validate required fields
    const titulo = formData.get("titulo") as string
    const descricao = formData.get("descricao") as string
    const tema = formData.get("tema") as string
    const tipo = formData.get("tipo") as string

    if (!titulo || !descricao || !tema || !tipo) {
      setError("Todos os campos são obrigatórios")
      return
    }

    setIsLoading(true)
    setError(null)
    setLoadingStage("Preparando dados")

    try {
      console.log("Submitting quiz form data...", {
        titulo,
        descricao,
        tema,
        tipo
      })

      // Adiciona o ID da paróquia e do usuário ao formData
      formData.append("parishId", parishId)
      formData.append("criadoPor", user.id as string)

      setLoadingStage("Enviando para IA...")
      
      // Enviar os dados via API regular para evitar timeout do Server Action
      const response = await fetch("/api/quizzes/create", {
        method: "POST",
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }
      
      setLoadingStage("Processando resultado...")
      const result = await response.json();
      
      if (result.success) {
        console.log("Quiz criado com sucesso, ID:", result.quizId, "com", result.questionsCount, "questões")
        // Redireciona para a página de quizzes ativos após criar o quiz
        router.push("/quizzes?tab=ativos")
      } else {
        console.error("Erro retornado pela API:", result.error)
        setError(result.error || "Falha ao criar quiz")
      }
    } catch (err) {
      console.error("Erro ao criar quiz:", err)
      setError(typeof err === 'object' && err !== null && 'message' in err 
        ? (err as Error).message 
        : "Falha ao criar quiz. Verifique sua conexão e tente novamente.")
    } finally {
      setIsLoading(false)
      setLoadingStage("")
    }
  }

  if (!user) {
    return (
      <div className="container max-w-md mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="animate-spin h-5 w-5" />
              Carregando...
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Criar Novo Quiz</h1>

      <Card>
        <form action={handleSubmit}>
          <CardHeader>
            <CardTitle>Detalhes do Quiz</CardTitle>
            <CardDescription>Digite os detalhes para o seu novo quiz de catecismo</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="titulo">Título do Quiz</Label>
              <Input id="titulo" name="titulo" required disabled={isLoading} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                name="descricao"
                placeholder="Breve descrição do que este quiz aborda"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tema">Tema/Tópico</Label>
              <Textarea
                id="tema"
                name="tema"
                placeholder="Descrição detalhada do tópico de catecismo para gerar questões"
                required
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">
                Forneça uma descrição detalhada do tópico de catecismo. Isso será usado para gerar as questões do quiz.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Quiz</Label>
              <RadioGroup defaultValue={user.tipo || "adulto"} name="tipo" disabled={isLoading}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="adulto" id="adulto" disabled={isLoading} />
                  <Label htmlFor="adulto">Catecismo para Adultos</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="crianca" id="crianca" disabled={isLoading} />
                  <Label htmlFor="crianca">Catecismo para Crianças</Label>
                </div>
              </RadioGroup>
            </div>

            {isLoading && (
              <Alert className="bg-blue-50 text-blue-800 border-blue-200">
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                <AlertTitle>Criando seu quiz</AlertTitle>
                <AlertDescription>
                  {loadingStage || "Processando..."} 
                  <p className="text-xs mt-1">Este processo pode levar até 60 segundos. Por favor, aguarde.</p>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>

          <CardFooter>
            <LoadingButton 
              type="submit" 
              className="w-full" 
              isLoading={isLoading} 
              loadingText="Gerando Quiz via IA..."
              disabled={isLoading}
            >
              Criar Quiz
            </LoadingButton>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

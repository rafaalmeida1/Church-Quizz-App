"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { createQuizAction } from "@/app/actions"
import { User } from "@/lib/types"

export default function CreateQuizPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [parishId, setParishId] = useState<string | null>(null)

  useEffect(() => {
    async function loadUserData() {
      try {
        const response = await fetch("/api/session")
        const data = await response.json()

        if (!data.success || !data.user) {
          router.push("/login")
          return
        }

        if (!data.parishId) {
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

    setIsLoading(true)
    setError(null)

    // Adiciona o ID da paróquia e do usuário ao formData
    formData.append("parishId", parishId)
    formData.append("criadoPor", user.id as string)

    try {
      const result = await createQuizAction(formData)
      
      if (result.success) {
        console.log("Quiz criado com sucesso, ID:", result.quizId)
        // Redireciona para o dashboard após criar o quiz
        router.push("/dashboard")
      } else {
        setError(result.error || "Falha ao criar quiz")
      }
    } catch (err) {
      console.error("Erro ao criar quiz:", err)
      setError("Falha ao criar quiz")
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="container max-w-md mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>Carregando...</CardTitle>
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
              <div className="p-3 text-sm bg-red-100 border border-red-200 text-red-600 rounded-md">{error}</div>
            )}

            <div className="space-y-2">
              <Label htmlFor="titulo">Título do Quiz</Label>
              <Input id="titulo" name="titulo" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                name="descricao"
                placeholder="Breve descrição do que este quiz aborda"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tema">Tema/Tópico</Label>
              <Textarea
                id="tema"
                name="tema"
                placeholder="Descrição detalhada do tópico de catecismo para gerar questões"
                required
              />
              <p className="text-xs text-gray-500">
                Forneça uma descrição detalhada do tópico de catecismo. Isso será usado para gerar as questões do quiz.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Quiz</Label>
              <RadioGroup defaultValue={user.tipo || "adulto"} name="tipo">
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

          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Gerando Quiz...
                </>
              ) : (
                "Criar Quiz"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

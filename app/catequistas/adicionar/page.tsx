"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { createCatequista } from "@/app/actions"

export default function AdicionarCatequistaPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [parishId, setParishId] = useState<string | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)

  // Carregar dados do usuário atual
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

        if (data.user.role !== "admin" && data.user.role !== "catequista") {
          router.push("/dashboard")
          return
        }

        setUser(data.user)
        setParishId(data.parishId)
      } catch (err) {
        console.error("Erro ao carregar dados do usuário:", err)
        setError("Falha ao carregar dados do usuário")
      } finally {
        setInitialLoading(false)
      }
    }

    loadUserData()
  }, [router])

  async function handleSubmit(formData: FormData) {
    if (!parishId) {
      setError("Paróquia não encontrada")
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(false)

    // Adiciona o ID da paróquia ao formData
    formData.append("parishId", parishId)

    try {
      const result = await createCatequista(formData)

      if (result.success) {
        setSuccess(true)
        // Limpa o formulário
        const form = document.getElementById("catequistaForm") as HTMLFormElement;
        if (form) form.reset();
      } else {
        setError(result.error || "Falha ao criar catequista")
      }
    } catch (err) {
      console.error("Erro ao criar catequista:", err)
      setError("Ocorreu um erro inesperado")
    } finally {
      setIsLoading(false)
    }
  }

  if (initialLoading) {
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

  if (!user || !parishId) {
    return (
      <div className="container max-w-md mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>Erro</CardTitle>
            <CardDescription>Você não tem permissão para acessar esta página.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push("/dashboard")} className="w-full">
              Voltar para o Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Adicionar Catequista</h1>

      <Card>
        <form id="catequistaForm" action={handleSubmit}>
          <CardHeader>
            <CardTitle>Informações do Catequista</CardTitle>
            <CardDescription>Adicione um novo catequista à sua paróquia</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm bg-red-100 border border-red-200 text-red-600 rounded-md">{error}</div>
            )}

            {success && (
              <div className="p-3 text-sm bg-green-100 border border-green-200 text-green-600 rounded-md">
                Catequista adicionado com sucesso!
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo</Label>
              <Input id="nome" name="nome" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" name="password" type="password" required />
            </div>

            <div className="space-y-2">
              <Label>Tipo de Catequese</Label>
              <RadioGroup defaultValue="adulto" name="tipo">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="adulto" id="adulto" />
                  <Label htmlFor="adulto">Catequese para Adultos</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="crianca" id="crianca" />
                  <Label htmlFor="crianca">Catequese para Crianças</Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>

          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Adicionando..." : "Adicionar Catequista"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

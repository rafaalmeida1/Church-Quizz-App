"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { validateInvite, createCatequisando } from "@/app/actions"

export default function RegistroCatequisandoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const tipo = searchParams.get("tipo")

  const [isLoading, setIsLoading] = useState(false)
  const [isValidating, setIsValidating] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [inviteData, setInviteData] = useState<{
    parishId: string
    email: string
    tipo: string
  } | null>(null)

  useEffect(() => {
    async function checkInvite() {
      if (!token) {
        setError("Token de convite inválido ou ausente")
        setIsValidating(false)
        return
      }

      try {
        const result = await validateInvite(token)

        if (result.success && result.invite) {
          setInviteData(result.invite)
        } else {
          setError(result.error || "Convite inválido")
        }
      } catch (err) {
        console.error("Erro ao validar convite:", err)
        setError("Ocorreu um erro ao validar o convite")
      } finally {
        setIsValidating(false)
      }
    }

    checkInvite()
  }, [token])

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setError(null)

    if (!inviteData) {
      setError("Dados do convite inválidos")
      setIsLoading(false)
      return
    }

    // Adiciona os dados do convite ao formData
    formData.append("parishId", inviteData.parishId)
    formData.append("tipo", inviteData.tipo)
    formData.append("inviteToken", token || "")

    try {
      const result = await createCatequisando(formData)

      if (result.success) {
        router.push("/login?registered=true")
      } else {
        setError(result.error || "Falha ao registrar")
      }
    } catch (err) {
      console.error("Erro no registro:", err)
      setError("Ocorreu um erro inesperado")
    } finally {
      setIsLoading(false)
    }
  }

  if (isValidating) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md text-center p-8">
          <div className="animate-spin mb-4 mx-auto">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mx-auto"
            >
              <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.85.83 6.67 2.21"></path>
              <path d="M21 3v9h-9"></path>
            </svg>
          </div>
          <p>Validando seu convite...</p>
        </Card>
      </div>
    )
  }

  if (error && !inviteData) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Convite Inválido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-3 text-sm bg-red-100 border border-red-200 text-red-600 rounded-md">{error}</div>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <a href="/">Voltar para a Página Inicial</a>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Registrar como Catequisando</CardTitle>
          <CardDescription className="text-center">Crie sua conta para participar do catecismo</CardDescription>
        </CardHeader>

        <form action={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm bg-red-100 border border-red-200 text-red-600 rounded-md">{error}</div>
            )}

            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo</Label>
              <Input id="nome" name="nome" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={inviteData?.email || ""}
                readOnly
                className="bg-gray-100"
              />
              <p className="text-xs text-gray-500">Este email está associado ao seu convite</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" name="password" type="password" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" required />
            </div>

            <div className="p-3 bg-blue-50 border border-blue-100 text-blue-700 rounded-md text-sm">
              <p className="font-semibold">Tipo de Catequese: {inviteData?.tipo === "adulto" ? "Adulto" : "Criança"}</p>
            </div>
          </CardContent>

          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Registrando..." : "Registrar"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

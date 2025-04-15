"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { createInviteAction, getSessionData } from "@/app/actions"

export default function ConvitesPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inviteLink, setInviteLink] = useState("")
  const [user, setUser] = useState<{ id: string; parishId: string } | null>(null)

  useEffect(() => {
    async function loadUser() {
      try {
        const { user: sessionUser, parishId } = await getSessionData()
        if (sessionUser && parishId) {
          setUser({
            id: sessionUser.id as string,
            parishId: parishId as string
          })
        } else {
          setError("Usuário não possui paróquia associada")
        }
      } catch (err) {
        console.error("Erro ao carregar dados do usuário:", err)
        setError("Erro ao carregar dados do usuário")
      }
    }
    loadUser()
  }, [])

  async function handleGenerateLink(formData: FormData) {
    if (!user) {
      setError("Usuário não autenticado")
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(false)

    // Adiciona o ID da paróquia e do usuário ao formData
    formData.append("parishId", user.parishId)
    formData.append("criadoPor", user.id)

    try {
      const result = await createInviteAction(formData)

      if (result.success) {
        const baseUrl = window.location.origin
        const link = `${baseUrl}/registro/catequisando?token=${result.token}&tipo=${result.tipo}`

        setInviteLink(link)
        setSuccess(true)
      } else {
        setError("Falha ao gerar link de convite")
      }
    } catch (err) {
      setError("Falha ao gerar link de convite")
      console.error(err)
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
      <h1 className="text-2xl font-bold mb-6">Convidar Catequisandos</h1>

      <Card>
        <form action={handleGenerateLink}>
          <CardHeader>
            <CardTitle>Gerar Convite</CardTitle>
            <CardDescription>Gere um link para convidar catequisandos a se juntarem à sua paróquia</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm bg-red-100 border border-red-200 text-red-600 rounded-md">{error}</div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email do Catequisando</Label>
              <Input id="email" name="email" type="email" required />
              <p className="text-xs text-gray-500">Este email será associado ao convite</p>
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

            <div className="space-y-2">
              <Label htmlFor="mensagem">Mensagem Personalizada (Opcional)</Label>
              <Textarea id="mensagem" name="mensagem" placeholder="Digite uma mensagem personalizada para o convite" />
            </div>

            {success && (
              <div className="p-4 bg-green-50 border border-green-100 rounded-md">
                <h3 className="font-semibold text-green-800 mb-2">Link de Convite Gerado!</h3>
                <div className="bg-white p-3 rounded border text-sm break-all mb-2">{inviteLink}</div>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(inviteLink)
                    }}
                  >
                    Copiar Link
                  </Button>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Gerando..." : "Gerar Convite"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

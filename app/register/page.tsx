"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { registerParish } from "@/app/actions"

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(1)

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setError(null)

    try {
      const result = await registerParish(formData)

      if (result.success) {
        router.push("/dashboard")
        router.refresh()
      } else {
        setError(result.error || "Falha no registro")
      }
    } catch (err) {
      console.error("Erro no registro:", err)
      setError("Ocorreu um erro inesperado. Por favor, tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  function validateStep1() {
    // Validação básica para o passo 1
    const nome = document.getElementById("nome") as HTMLInputElement
    const endereco = document.getElementById("endereco") as HTMLInputElement
    const cidade = document.getElementById("cidade") as HTMLInputElement
    const estado = document.getElementById("estado") as HTMLInputElement
    const cep = document.getElementById("cep") as HTMLInputElement
    const telefone = document.getElementById("telefone") as HTMLInputElement
    const email = document.getElementById("email") as HTMLInputElement

    if (
      !nome.value ||
      !endereco.value ||
      !cidade.value ||
      !estado.value ||
      !cep.value ||
      !telefone.value ||
      !email.value
    ) {
      setError("Por favor, preencha todos os campos obrigatórios")
      return false
    }

    setError(null)
    return true
  }

  function handleNextStep() {
    if (validateStep1()) {
      setCurrentStep(2)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Registrar Paróquia</CardTitle>
          <CardDescription className="text-center">
            {currentStep === 1 ? "Digite as informações da sua paróquia" : "Crie uma conta de administrador"}
          </CardDescription>
        </CardHeader>

        <form action={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm bg-red-100 border border-red-200 text-red-600 rounded-md">{error}</div>
            )}

            {currentStep === 1 ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome da Paróquia</Label>
                  <Input id="nome" name="nome" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input id="endereco" name="endereco" required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input id="cidade" name="cidade" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado</Label>
                    <Input id="estado" name="estado" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cep">CEP</Label>
                  <Input id="cep" name="cep" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input id="telefone" name="telefone" type="tel" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email da Paróquia</Label>
                  <Input id="email" name="email" type="email" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website (Opcional)</Label>
                  <Input id="website" name="website" type="url" />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="adminNome">Nome do Administrador</Label>
                  <Input id="adminNome" name="adminNome" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Email do Administrador</Label>
                  <Input id="adminEmail" name="adminEmail" type="email" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input id="password" name="password" type="password" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                  <Input id="confirmPassword" name="confirmPassword" type="password" required />
                </div>
              </>
            )}
          </CardContent>

          <CardFooter>
            {currentStep === 1 ? (
              <Button type="button" className="w-full" onClick={handleNextStep}>
                Próximo
              </Button>
            ) : (
              <div className="flex w-full space-x-2">
                <Button type="button" variant="outline" onClick={() => setCurrentStep(1)} className="flex-1">
                  Voltar
                </Button>
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? "Registrando..." : "Registrar"}
                </Button>
              </div>
            )}
          </CardFooter>
        </form>

        <div className="p-4 text-center text-sm">
          Já tem uma conta?{" "}
          <a href="/login" className="text-primary hover:underline">
            Entrar
          </a>
        </div>
      </Card>
    </div>
  )
}

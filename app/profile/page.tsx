"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { logout } from "@/app/actions"
import { Award, Target, TrendingUp } from "lucide-react"
import dynamic from "next/dynamic"

// Import the weekly goal component dynamically to prevent hydration issues
const WeeklyGoalComponent = dynamic(
  () => import('./weekly-goal'),
  { ssr: false }
)

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
  })
  
  const [passwordData, setPasswordData] = useState({
    password: ""
  })
  
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const [xpStats, setXpStats] = useState({
    totalXP: 0,
    level: 1,
    weeklyXP: 0
  })

  useEffect(() => {
    async function loadUserData() {
      try {
        setIsLoading(true)
        const response = await fetch("/api/session")
        const data = await response.json()

        if (!data.success || !data.user) {
          router.push("/login")
          return
        }

        setUser(data.user)
        setFormData({
          nome: data.user.nome || "",
          email: data.user.email || "",
        })
        
        // Fetch XP stats if available
        if (data.user.id) {
          try {
            const xpResponse = await fetch(`/api/user/${data.user.id}/xp`)
            const xpData = await xpResponse.json()
            
            if (xpData.success) {
              setXpStats({
                totalXP: xpData.stats.totalXP || 0,
                level: xpData.stats.level || 1,
                weeklyXP: xpData.stats.weeklyXP || 0
              })
            }
          } catch (error) {
            console.error("Erro ao carregar estatísticas de XP:", error)
          }
        }
      } catch (err) {
        console.error("Erro ao carregar dados do usuário:", err)
        setError("Falha ao carregar dados do usuário")
      } finally {
        setIsLoading(false)
      }
    }

    loadUserData()
  }, [router])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  async function handleSave() {
    try {
      const response = await fetch("/api/user/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: formData.nome,
          email: formData.email,
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        setUser({
          ...user,
          nome: formData.nome,
          email: formData.email,
        })
        setIsEditing(false)
      } else {
        setError(data.error || "Falha ao atualizar perfil")
      }
    } catch (err) {
      console.error("Erro ao atualizar perfil:", err)
      setError("Falha ao atualizar perfil")
    }
  }

  function handlePasswordChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    })
  }
  
  async function handleUpdatePassword() {
    try {
      setIsUpdatingPassword(true)
      setPasswordError(null)
      setPasswordSuccess(false)
      
      const response = await fetch("/api/user/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(passwordData),
      })

      const data = await response.json()
      
      if (data.success) {
        setPasswordSuccess(true)
        setPasswordData({ password: "" })
      } else {
        setPasswordError(data.error || "Falha ao atualizar senha")
      }
    } catch (err) {
      console.error("Erro ao atualizar senha:", err)
      setPasswordError("Falha ao atualizar senha")
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  if (isLoading) {
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

  if (error) {
    return (
      <div className="container max-w-md mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>Erro</CardTitle>
            <CardDescription>{error}</CardDescription>
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

  if (!user) {
    return (
      <div className="container max-w-md mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>Usuário não encontrado</CardTitle>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push("/login")} className="w-full">
              Fazer Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Perfil</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Informações da Conta</CardTitle>
          <CardDescription>Gerencie suas informações pessoais</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {isEditing ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input id="nome" name="nome" value={formData.nome} onChange={handleChange} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Nome</Label>
                <p>{user.nome}</p>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Email</Label>
                <p>{user.email}</p>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Função</Label>
                <p className="capitalize">
                  {user.role === "admin" 
                    ? "Administrador" 
                    : user.role === "catequista" 
                      ? "Catequista" 
                      : "Catequisando"}
                </p>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Membro Desde</Label>
                <p>{new Date(user.criadoEm).toLocaleDateString()}</p>
              </div>
            </>
          )}
        </CardContent>

        <CardFooter>
          {isEditing ? (
            <div className="flex w-full space-x-2">
              <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleSave} className="flex-1">
                Salvar
              </Button>
            </div>
          ) : (
            <Button variant="outline" onClick={() => setIsEditing(true)} className="w-full">
              Editar Perfil
            </Button>
          )}
        </CardFooter>
      </Card>
      
      {/* XP Stats Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Award className="h-5 w-5 mr-2 text-primary" />
            Estatísticas de XP
          </CardTitle>
          <CardDescription>
            Seu progresso e conquistas na catequese
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col items-center justify-center p-3 bg-primary/5 rounded-lg">
              <span className="text-xs text-muted-foreground mb-1">Nível</span>
              <span className="text-2xl font-bold text-primary">{xpStats.level}</span>
            </div>
            
            <div className="flex flex-col items-center justify-center p-3 bg-accent/5 rounded-lg">
              <span className="text-xs text-muted-foreground mb-1">XP Total</span>
              <span className="text-2xl font-bold text-accent">{xpStats.totalXP}</span>
            </div>
            
            <div className="flex flex-col items-center justify-center p-3 bg-secondary/5 rounded-lg">
              <span className="text-xs text-muted-foreground mb-1">Semanal</span>
              <span className="text-2xl font-bold text-secondary">{xpStats.weeklyXP}</span>
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground mt-4">
            <p className="flex items-center">
              <TrendingUp className="h-4 w-4 mr-1 text-muted-foreground" /> 
              Continue completando quizzes para ganhar XP e subir de nível.
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Weekly XP Goal Component */}
      {user && user.id && (
        <div className="mb-6">
          <WeeklyGoalComponent userId={user.id} />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Configurações da Conta</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Alterar Senha</Label>
            {passwordError && (
              <div className="p-3 text-sm bg-red-100 border border-red-200 text-red-600 rounded-md">
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="p-3 text-sm bg-green-100 border border-green-200 text-green-600 rounded-md">
                Senha atualizada com sucesso!
              </div>
            )}
            <div className="flex space-x-2">
              <Input 
                id="password" 
                name="password" 
                type="password" 
                placeholder="Nova senha" 
                value={passwordData.password}
                onChange={handlePasswordChange}
              />
              <Button 
                variant="outline" 
                onClick={handleUpdatePassword}
                disabled={isUpdatingPassword || !passwordData.password}
              >
                {isUpdatingPassword ? "Atualizando..." : "Atualizar"}
              </Button>
            </div>
          </div>
        </CardContent>

        <CardFooter>
          <form action={logout} className="w-full">
            <Button type="submit" variant="destructive" className="w-full">
              Sair
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  )
}

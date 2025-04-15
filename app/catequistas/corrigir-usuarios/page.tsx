"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle2, UserPlus, UserCog, Trash2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function CorrigirUsuariosPage() {
  const router = useRouter()
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [rawUserIds, setRawUserIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null)
  const [operacaoAtual, setOperacaoAtual] = useState<string | null>(null)
  
  useEffect(() => {
    const carregarUsuarios = async () => {
      try {
        const response = await fetch('/api/diagnostico/users')
        if (!response.ok) {
          throw new Error('Falha ao buscar usuários')
        }
        
        const data = await response.json()
        
        if (data.success) {
          setUsuarios(data.usuarios || [])
          setRawUserIds(data.rawUserIds || [])
        } else {
          throw new Error(data.error || 'Erro ao carregar dados')
        }
      } catch (error) {
        console.error('Erro:', error)
        setStatusMessage({
          type: 'error',
          message: error instanceof Error ? error.message : 'Erro desconhecido'
        })
      } finally {
        setLoading(false)
      }
    }
    
    carregarUsuarios()
  }, [])
  
  const executarOperacao = async (userId: string, operation: string) => {
    setOperacaoAtual(userId)
    setStatusMessage(null)
    
    try {
      const response = await fetch('/api/diagnostico/corrigir', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          operation
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        setStatusMessage({
          type: 'success',
          message: `Operação '${operation}' realizada com sucesso`
        })
        
        // Recarregar dados
        router.refresh()
        
        // Recarregar dados após um curto delay
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } else {
        throw new Error(data.error || 'Falha na operação')
      }
    } catch (error) {
      console.error('Erro:', error)
      setStatusMessage({
        type: 'error',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    } finally {
      setOperacaoAtual(null)
    }
  }
  
  if (loading) {
    return (
      <div className="container py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Carregando...</CardTitle>
            <CardDescription>Aguarde enquanto carregamos os dados dos usuários</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="container py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold font-cinzel text-primary">Corrigir Usuários</h1>
        <p className="text-muted-foreground mt-1">
          Ferramentas para resolver problemas relacionados aos usuários
        </p>
      </div>
      
      {statusMessage && (
        <Alert className={`mb-6 ${
          statusMessage.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' :
          statusMessage.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' :
          'bg-blue-50 text-blue-800 border-blue-200'
        }`}>
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertTitle>
            {statusMessage.type === 'success' ? 'Sucesso' : 
             statusMessage.type === 'error' ? 'Erro' : 'Informação'}
          </AlertTitle>
          <AlertDescription>
            {statusMessage.message}
          </AlertDescription>
        </Alert>
      )}
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Gerenciar Usuários</CardTitle>
          <CardDescription>
            Corrigir problemas de associação e papéis de usuários
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {usuarios.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuarios.map((usuario) => (
                  <TableRow key={usuario.id}>
                    <TableCell className="font-medium">{usuario.nome}</TableCell>
                    <TableCell>{usuario.email}</TableCell>
                    <TableCell>
                      <Badge variant={
                        usuario.role === "admin" ? "default" : 
                        usuario.role === "catequista" ? "outline" : 
                        "secondary"
                      }>
                        {usuario.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => executarOperacao(usuario.id, 'converterParaCatequista')}
                          disabled={operacaoAtual === usuario.id || usuario.role === 'catequista'}
                        >
                          <UserPlus className="h-3.5 w-3.5 mr-1" />
                          Tornar Catequista
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => executarOperacao(usuario.id, 'converterParaCatequisando')}
                          disabled={operacaoAtual === usuario.id || usuario.role === 'catequisando'}
                        >
                          <UserCog className="h-3.5 w-3.5 mr-1" />
                          Tornar Catequisando
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center p-6 bg-muted/10 rounded-lg">
              <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Nenhum usuário encontrado</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Não há usuários associados à sua paróquia.
              </p>
            </div>
          )}
        </CardContent>
        
        <CardFooter>
          <Button onClick={() => router.push('/catequistas')} variant="outline">
            Voltar para Catequistas
          </Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>IDs de Usuários no Redis</CardTitle>
          <CardDescription>
            Verificar e corrigir associações diretas no banco de dados
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="text-xs text-muted-foreground overflow-auto max-h-40 p-3 bg-muted/20 rounded mb-4">
            {rawUserIds.length > 0 ? (
              <ul className="space-y-1">
                {rawUserIds.map((id) => (
                  <li key={id} className="flex items-center justify-between">
                    <span>{id}</span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-6 text-red-500 hover:text-red-700 hover:bg-red-100"
                      onClick={() => executarOperacao(id, 'desassociarParoquia')}
                      disabled={operacaoAtual === id}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Nenhum ID de usuário encontrado</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Spinner } from "@/components/ui/loading"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertTriangle, FileWarning, Database, RefreshCw } from "lucide-react"

export default function SystemHealthPage() {
  const [repairing, setRepairing] = useState(false)
  const [repairResult, setRepairResult] = useState<any>(null)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("quizzes")

  async function repairSystem() {
    try {
      setRepairing(true)
      setError("")
      
      const response = await fetch("/api/admin/repair-system", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          repairQuizzes: true,
          repairStructures: true,
          auditData: true
        })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || "Falha ao reparar o sistema")
      }
      
      setRepairResult(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido")
    } finally {
      setRepairing(false)
    }
  }

  async function repairSpecificQuiz(quizId: string) {
    if (!quizId) {
      setError("ID do quiz é obrigatório")
      return
    }
    
    try {
      setRepairing(true)
      setError("")
      
      const response = await fetch("/api/admin/repair-specific-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || "Falha ao reparar o quiz")
      }
      
      setRepairResult({
        ...repairResult,
        quizRepaired: { id: quizId, success: true }
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido")
    } finally {
      setRepairing(false)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Sistema - Diagnóstico e Reparos</h1>
      
      <Tabs defaultValue="quizzes" className="mb-6" 
        onValueChange={(value) => setActiveTab(value)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="quizzes">
            <FileWarning className="mr-2 h-4 w-4" />
            Quizzes
          </TabsTrigger>
          <TabsTrigger value="database">
            <Database className="mr-2 h-4 w-4" />
            Banco de Dados
          </TabsTrigger>
          <TabsTrigger value="repair">
            <RefreshCw className="mr-2 h-4 w-4" />
            Reparação Geral
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="quizzes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reparação de Quiz Específico</CardTitle>
              <CardDescription>
                Corrija problemas em um quiz específico pelo ID
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-3">
                    <input
                      className="w-full p-2 border rounded"
                      placeholder="Digite o ID do quiz (ex: quiz:1744743460419)"
                      id="quizId"
                    />
                  </div>
                  <div>
                    <Button 
                      disabled={repairing}
                      onClick={() => repairSpecificQuiz(
                        (document.getElementById('quizId') as HTMLInputElement)?.value
                      )}
                      className="w-full"
                    >
                      {repairing ? <Spinner size="small" /> : "Reparar Quiz"}
                    </Button>
                  </div>
                </div>
                
                {repairResult?.quizRepaired && (
                  <Alert className="bg-green-50 border-green-200 text-green-800">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <AlertTitle>Sucesso</AlertTitle>
                    <AlertDescription>
                      Quiz {repairResult.quizRepaired.id} reparado com sucesso.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Problemas Comuns em Quizzes</CardTitle>
              <CardDescription>
                Soluções para problemas típicos com quizzes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2">
                <li>Erros de <code>Cannot read properties of undefined (reading 'length')</code> geralmente são causados por problemas no array de questões</li>
                <li>Se um quiz não aparece na lista, pode haver problemas na referência entre a paróquia e o quiz</li>
                <li>Quizzes com estado <code>gerando</code> travados podem ser reparados e convertidos para <code>encerrado</code></li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="database">
          <Card>
            <CardHeader>
              <CardTitle>Reparação da Base de Dados</CardTitle>
              <CardDescription>
                Corrige referências quebradas e limpa dados corrompidos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                Este processo verifica e corrige problemas estruturais no banco de dados, como referências quebradas entre paróquias e quizzes.
              </p>
              <Button 
                onClick={repairSystem} 
                disabled={repairing}
                variant="outline"
              >
                {repairing ? <Spinner size="small" /> : <Database className="mr-2 h-4 w-4" />}
                Reparar Estrutura do Banco
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="repair">
          <Card>
            <CardHeader>
              <CardTitle>Reparação Completa do Sistema</CardTitle>
              <CardDescription>
                Executa todas as verificações e reparos necessários
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button 
                  onClick={repairSystem}
                  disabled={repairing}
                  className="w-full"
                  size="lg"
                >
                  {repairing ? 
                    <><Spinner size="small" /> Reparando Sistema...</> : 
                    <>Iniciar Reparação Completa</>
                  }
                </Button>
                
                {error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erro</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                {repairResult && !error && (
                  <Alert className="bg-green-50 border-green-200 text-green-800">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <AlertTitle>Reparação Concluída</AlertTitle>
                    <AlertDescription>
                      <div className="mt-2">
                        <p>Quizzes reparados: {repairResult.results.repairedQuizzes}</p>
                        <p>Total de quizzes verificados: {repairResult.results.totalQuizzes}</p>
                        <p>Falhas: {repairResult.results.failedQuizzes}</p>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 
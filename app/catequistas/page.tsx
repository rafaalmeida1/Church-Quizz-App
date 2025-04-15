import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { 
  getParishCatequistas,
  getParishUsers,
  getParish
} from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { UserRound, UserPlus, Mail, Plus, AlertCircle, Wrench } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { kv } from "@vercel/kv"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default async function CatequistasPage() {
  const { user, parishId } = await getSession()

  // Verificar se o usuário está logado e é admin
  if (!user || user.role !== "admin") {
    redirect("/dashboard")
  }

  // Buscar informações da paróquia
  const parish = await getParish(parishId!)
  
  // Buscar catequistas e todos os usuários da paróquia para diagnóstico
  const catequistas = await getParishCatequistas(parishId!)
  const todosUsuarios = await getParishUsers(parishId!)
  
  // Verificar IDs de usuários diretamente do Redis
  const userIdsFromRedis = await kv.smembers(`parish:${parishId}:users`)
  
  // Estatísticas gerais
  const estatisticas = {
    totalUsuarios: todosUsuarios.length,
    totalCatequistas: catequistas.length,
    totalAdmin: todosUsuarios.filter(u => u.role === "admin").length,
    totalCatequisandos: todosUsuarios.filter(u => u.role === "catequisando").length,
    totalRawIds: userIdsFromRedis.length
  }
  
  return (
    <div className="container py-6 pb-24 md:pb-6 max-w-5xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold font-cinzel text-primary">Catequistas</h1>
          <p className="text-muted-foreground mt-1">
            Gerenciamento de catequistas da paróquia {parish?.nome}
          </p>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <Button asChild>
            <a href="/catequistas/adicionar" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              <span>Adicionar Catequista</span>
            </a>
          </Button>
          
          <Button asChild variant="outline">
            <a href="/catequistas/convites" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span>Convites</span>
            </a>
          </Button>
          
          <Button asChild variant="secondary">
            <a href="/catequistas/corrigir-usuarios" className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              <span>Corrigir Usuários</span>
            </a>
          </Button>
        </div>
      </div>
      
      {catequistas.length === 0 && todosUsuarios.length > 0 && (
        <Alert className="mb-6 bg-amber-50 text-amber-800 border-amber-200">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Atenção!</AlertTitle>
          <AlertDescription>
            Sua paróquia tem {estatisticas.totalUsuarios} usuários, mas nenhum deles está registrado como catequista. 
            Use a <a href="/catequistas/corrigir-usuarios" className="font-medium underline">ferramenta de correção</a> para resolver este problema.
          </AlertDescription>
        </Alert>
      )}
      
      {estatisticas.totalUsuarios > 0 && (
        <div className="mb-6 p-4 bg-muted/20 rounded-lg border border-border">
          <h3 className="text-lg font-medium mb-2">Informações da Paróquia</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total de Usuários</p>
              <p className="text-xl font-bold">{estatisticas.totalUsuarios}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Catequistas</p>
              <p className="text-xl font-bold">{estatisticas.totalCatequistas}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Administradores</p>
              <p className="text-xl font-bold">{estatisticas.totalAdmin}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Catequisandos</p>
              <p className="text-xl font-bold">{estatisticas.totalCatequisandos}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">IDs no Redis</p>
              <p className="text-xl font-bold">{estatisticas.totalRawIds}</p>
            </div>
          </div>
        </div>
      )}
      
      <Tabs defaultValue="catequistas" className="mb-6">
        <TabsList>
          <TabsTrigger value="catequistas">Catequistas</TabsTrigger>
          <TabsTrigger value="todos">Todos os Usuários</TabsTrigger>
        </TabsList>
        
        <TabsContent value="catequistas">
          {catequistas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {catequistas.map((catequista) => (
                <Card key={catequista.id} className="overflow-hidden card-vitral">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 bg-primary/10 border-2 border-primary/20">
                        <AvatarFallback className="bg-primary text-primary-foreground font-cinzel">
                          {catequista.nome.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{catequista.nome}</CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <UserRound className="h-3 w-3" />
                          {catequista.email}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge variant="outline" className="bg-primary/5">
                        Catequista
                      </Badge>
                      
                      <Badge variant="outline" className="bg-accent/5">
                        {catequista.tipo === "adulto" ? "Catequese de Adultos" : "Catequese Infantil"}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      <p>Membro desde {new Date(catequista.criadoEm).toLocaleDateString('pt-BR')}</p>
                      <p className="mt-1 text-xs">ID: {catequista.id}</p>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="border-t bg-muted/10 px-6 py-3">
                    <div className="flex justify-end w-full gap-2">
                      <Button variant="outline" size="sm" className="text-xs">
                        Ver Detalhes
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center p-8 bg-muted/10">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <AlertCircle className="h-10 w-10 text-amber-500" />
              </div>
              <h2 className="mt-6 text-xl font-semibold">Nenhum catequista encontrado</h2>
              <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
                A paróquia tem {estatisticas.totalUsuarios} usuários, mas nenhum deles está registrado como catequista.
                Isso pode acontecer se os usuários foram criados com um papel diferente.
              </p>
              <div className="mt-6 flex gap-3 justify-center">
                <Button asChild>
                  <a href="/catequistas/adicionar" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    <span>Adicionar Catequista</span>
                  </a>
                </Button>
                
                {todosUsuarios.length > 0 && (
                  <Button asChild variant="secondary">
                    <a href="/catequistas/corrigir-usuarios" className="flex items-center gap-2">
                      <Wrench className="h-4 w-4" />
                      <span>Corrigir Usuários</span>
                    </a>
                  </Button>
                )}
              </div>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="todos">
          <div className="overflow-x-auto -mx-4 sm:mx-0 mb-6">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/30">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Nome
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Papel
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Tipo
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      ID
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-background divide-y divide-border">
                  {todosUsuarios.map((usuario) => (
                    <tr key={usuario.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {usuario.nome}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {usuario.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={
                          usuario.role === "admin" ? "default" : 
                          usuario.role === "catequista" ? "outline" : 
                          "secondary"
                        }>
                          {usuario.role}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {usuario.tipo || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-muted-foreground">
                        {usuario.id}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {todosUsuarios.length === 0 && (
            <div className="text-center p-8 bg-muted/10 rounded-lg border">
              <AlertCircle className="h-10 w-10 mx-auto text-amber-500 mb-4" />
              <h3 className="text-lg font-medium">Nenhum usuário encontrado na paróquia</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Parece que não há usuários associados a esta paróquia no banco de dados.
              </p>
            </div>
          )}
          
          <div className="mt-6 p-4 bg-muted/10 rounded-lg border border-border">
            <h3 className="text-md font-medium mb-3">IDs de Usuários no Redis:</h3>
            <div className="text-xs text-muted-foreground overflow-auto max-h-32 p-2 bg-muted/30 rounded">
              {userIdsFromRedis.length > 0 ? (
                <pre>{userIdsFromRedis.join('\n')}</pre>
              ) : (
                <p>Nenhum ID de usuário encontrado no Redis para esta paróquia.</p>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 
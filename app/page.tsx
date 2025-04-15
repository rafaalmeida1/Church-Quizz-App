import { Button } from "@/components/ui/button"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function Home() {
  const { user } = await getSession()

  // Se o usuário estiver logado, redireciona para o dashboard
  if (user) {
    redirect("/dashboard")
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <div className="mb-8 animate-bounce">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-primary"
        >
          <path d="M12 2v20" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      </div>

      <h1 className="text-4xl font-bold mb-2">Catecismo Católico</h1>
      <p className="text-xl mb-8 text-gray-600 dark:text-gray-400">Aprenda e cresça na sua fé</p>

      <div className="space-y-4 w-full max-w-md">
        <Button asChild className="w-full py-6 text-lg" variant="default">
          <a href="/login">Entrar</a>
        </Button>

        <Button asChild className="w-full py-6 text-lg" variant="outline">
          <a href="/register">Registrar Paróquia</a>
        </Button>
      </div>

      <div className="mt-12 space-y-8">
        <div className="flex items-center space-x-4">
          <div className="bg-primary/10 p-3 rounded-full">
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
              className="text-primary"
            >
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <div className="text-left">
            <h3 className="font-semibold">Quizzes Interativos</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Teste seu conhecimento com quizzes divertidos</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="bg-primary/10 p-3 rounded-full">
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
              className="text-primary"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="text-left">
            <h3 className="font-semibold">Gestão de Paróquia</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Organize catequistas e catequisandos</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="bg-primary/10 p-3 rounded-full">
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
              className="text-primary"
            >
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <line x1="10" y1="9" x2="8" y2="9" />
            </svg>
          </div>
          <div className="text-left">
            <h3 className="font-semibold">Conteúdo Gerado por IA</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Quizzes frescos criados com IA</p>
          </div>
        </div>
      </div>
    </div>
  )
}

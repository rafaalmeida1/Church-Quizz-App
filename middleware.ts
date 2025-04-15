import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret_change_this")

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value
  const pathname = request.nextUrl.pathname

  // Rotas públicas que não requerem autenticação
  if (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.includes("favicon") ||
    pathname.startsWith("/registro/catequisando") // Rota para registro via convite
  ) {
    return NextResponse.next()
  }

  // Verifica se o usuário está autenticado
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  try {
    // Verifica o token
    const { payload } = await jwtVerify(token, JWT_SECRET)

    // Controle de acesso baseado em função
    const role = payload.role as string

    // Rotas apenas para admin
    if (pathname.startsWith("/admin") && role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    // Rotas apenas para catequistas
    if (pathname.startsWith("/catequista") && role !== "catequista" && role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    return NextResponse.next()
  } catch (error) {
    console.error("Erro no middleware:", error)
    // Token inválido, redireciona para login
    return NextResponse.redirect(new URL("/login", request.url))
  }
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
}

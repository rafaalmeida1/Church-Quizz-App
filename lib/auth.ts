import { cookies } from "next/headers"
import type { User } from "./types"
import { getUser, getUserByEmail } from "./db"
import bcrypt from "bcryptjs"
import { SignJWT, jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret_change_this")

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export async function createSession(user: User): Promise<string> {
  // Cria um token JWT
  const token = await new SignJWT({
    id: user.id,
    email: user.email,
    role: user.role,
    parishId: user.parishId,
    tipo: user.tipo,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET)

  return token
}

export async function getSession(): Promise<{ user: User | null; parishId: string | null }> {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth-token")?.value

  if (!token) {
    return { user: null, parishId: null }
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    const userId = payload.id as string

    if (!userId) {
      return { user: null, parishId: null }
    }

    const user = await getUser(userId)

    return {
      user,
      parishId: user?.parishId || null,
    }
  } catch (error) {
    console.error("Erro na sessão:", error)
    return { user: null, parishId: null }
  }
}

export async function login(
  email: string,
  password: string,
): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    const user = await getUserByEmail(email)

    if (!user) {
      return { success: false, error: "Usuário não encontrado" }
    }

    const passwordMatch = await comparePasswords(password, user.password)

    if (!passwordMatch) {
      return { success: false, error: "Senha inválida" }
    }

    const token = await createSession(user)

    return { success: true, token }
  } catch (error) {
    console.error("Erro no login:", error)
    return { success: false, error: "Falha no login" }
  }
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete("auth-token")
}

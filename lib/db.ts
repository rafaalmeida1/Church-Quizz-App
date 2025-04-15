import { kv } from "@vercel/kv"
import type { Parish, User, Quiz, QuizResponse, Convite } from "./types"

// Funções relacionadas à Paróquia (Tenant)
export async function createParish(parishData: Parish): Promise<string> {
  try {
    const id = `parish:${Date.now()}`

    // Converte o objeto parish para uma estrutura chave-valor plana
    const serializedParish: Record<string, string> = {}

    // Serializa cada campo individualmente
    Object.entries(parishData).forEach(([key, value]) => {
      if (value !== undefined) {
        // Converte objetos/arrays para strings JSON
        if (typeof value === "object") {
          serializedParish[key] = JSON.stringify(value)
        } else {
          serializedParish[key] = String(value)
        }
      }
    })

    // Armazena os dados da paróquia
    await kv.hset(id, serializedParish)

    // Adiciona o ID da paróquia ao conjunto de paróquias
    await kv.sadd("parishes", id)

    return id
  } catch (error) {
    console.error("Erro ao criar paróquia:", error)
    throw error
  }
}

export async function getParish(id: string): Promise<Parish | null> {
  try {
    const parish = await kv.hgetall(id)

    if (!parish) return null

    // Converte valores de string de volta para seus tipos originais
    const parsedParish: Record<string, any> = {}

    Object.entries(parish).forEach(([key, value]) => {
      if (typeof value === "string") {
        try {
          // Tenta analisar strings JSON de volta para objetos/arrays
          parsedParish[key] = JSON.parse(value)
        } catch {
          // Se não for JSON, mantém como está
          parsedParish[key] = value
        }
      } else {
        parsedParish[key] = value
      }
    })

    return { ...parsedParish, id } as Parish
  } catch (error) {
    console.error("Erro ao obter paróquia:", error)
    return null
  }
}

export async function getAllParishes(): Promise<Parish[]> {
  try {
    const parishIds = await kv.smembers("parishes")
    const parishes = await Promise.all(
      parishIds.map(async (id) => {
        const parish = await getParish(id)
        return parish ? { ...parish, id } : null
      }),
    )

    return parishes.filter(Boolean) as Parish[]
  } catch (error) {
    console.error("Erro ao obter todas as paróquias:", error)
    return []
  }
}

// Funções relacionadas ao Usuário
export async function createUser(userData: User): Promise<string> {
  try {
    const id = `user:${Date.now()}`

    // Converte o objeto user para uma estrutura chave-valor plana
    const serializedUser: Record<string, string> = {}

    // Serializa cada campo individualmente
    Object.entries(userData).forEach(([key, value]) => {
      if (value !== undefined) {
        // Converte objetos/arrays para strings JSON
        if (typeof value === "object") {
          serializedUser[key] = JSON.stringify(value)
        } else {
          serializedUser[key] = String(value)
        }
      }
    })

    // Armazena os dados do usuário
    await kv.hset(id, serializedUser)

    // Adiciona o ID do usuário ao conjunto de usuários
    await kv.sadd("users", id)

    // Adiciona o ID do usuário ao conjunto de usuários da paróquia
    await kv.sadd(`parish:${userData.parishId}:users`, id)

    return id
  } catch (error) {
    console.error("Erro ao criar usuário:", error)
    throw error
  }
}

export async function getUser(id: string): Promise<User | null> {
  try {
    const user = await kv.hgetall(id)

    if (!user) return null

    // Converte valores de string de volta para seus tipos originais
    const parsedUser: Record<string, any> = {}

    Object.entries(user).forEach(([key, value]) => {
      if (typeof value === "string") {
        try {
          // Tenta analisar strings JSON de volta para objetos/arrays
          parsedUser[key] = JSON.parse(value)
        } catch {
          // Se não for JSON, mantém como está
          parsedUser[key] = value
        }
      } else {
        parsedUser[key] = value
      }
    })

    return { ...parsedUser, id } as User
  } catch (error) {
    console.error("Erro ao obter usuário:", error)
    return null
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const userIds = await kv.smembers("users")

    for (const userId of userIds) {
      const userData = await kv.hgetall(userId)

      if (userData && userData.email === email) {
        return { ...userData, id: userId } as User
      }
    }

    return null
  } catch (error) {
    console.error("Erro ao obter usuário por email:", error)
    return null
  }
}

export async function getParishUsers(parishId: string): Promise<User[]> {
  try {
    const userIds = await kv.smembers(`parish:${parishId}:users`)

    const users = await Promise.all(
      userIds.map(async (id) => {
        const user = await getUser(id)
        return user ? { ...user, id } : null
      }),
    )

    return users.filter(Boolean) as User[]
  } catch (error) {
    console.error("Erro ao obter usuários da paróquia:", error)
    return []
  }
}

export async function getParishCatequistas(parishId: string): Promise<User[]> {
  try {
    const users = await getParishUsers(parishId)
    return users.filter((user) => user.role === "catequista")
  } catch (error) {
    console.error("Erro ao obter catequistas da paróquia:", error)
    return []
  }
}

export async function getParishCatequisandos(parishId: string): Promise<User[]> {
  try {
    const users = await getParishUsers(parishId)
    return users.filter((user) => user.role === "catequisando")
  } catch (error) {
    console.error("Erro ao obter catequisandos da paróquia:", error)
    return []
  }
}

// Funções relacionadas ao Quiz
export async function createQuiz(quizData: Quiz): Promise<string> {
  try {
    const id = `quiz:${Date.now()}`

    // Converte o objeto quiz para uma estrutura chave-valor plana
    const serializedQuiz: Record<string, string> = {}

    // Serializa cada campo individualmente
    Object.entries(quizData).forEach(([key, value]) => {
      if (value !== undefined) {
        // Converte objetos/arrays para strings JSON
        if (typeof value === "object") {
          serializedQuiz[key] = JSON.stringify(value)
        } else {
          serializedQuiz[key] = String(value)
        }
      }
    })

    // Armazena os dados do quiz
    await kv.hset(id, serializedQuiz)

    // Adiciona o ID do quiz ao conjunto de quizzes da paróquia
    await kv.sadd(`parish:${quizData.parishId}:quizzes`, id)

    return id
  } catch (error) {
    console.error("Erro ao criar quiz:", error)
    throw error
  }
}

export async function getQuiz(id: string): Promise<Quiz | null> {
  try {
    const quiz = await kv.hgetall(id)

    if (!quiz) return null

    // Converte valores de string de volta para seus tipos originais
    const parsedQuiz: Record<string, any> = {}

    Object.entries(quiz).forEach(([key, value]) => {
      if (typeof value === "string") {
        try {
          // Tenta analisar strings JSON de volta para objetos/arrays
          parsedQuiz[key] = JSON.parse(value)
        } catch {
          // Se não for JSON, mantém como está
          parsedQuiz[key] = value
        }
      } else {
        parsedQuiz[key] = value
      }
    })

    return { ...parsedQuiz, id } as Quiz
  } catch (error) {
    console.error("Erro ao obter quiz:", error)
    return null
  }
}

export async function getParishQuizzes(parishId: string): Promise<Quiz[]> {
  try {
    const quizIds = await kv.smembers(`parish:${parishId}:quizzes`)

    const quizzes = await Promise.all(
      quizIds.map(async (id) => {
        const quiz = await getQuiz(id)
        return quiz ? { ...quiz, id } : null
      }),
    )

    return quizzes.filter(Boolean) as Quiz[]
  } catch (error) {
    console.error("Erro ao obter quizzes da paróquia:", error)
    return []
  }
}

export async function getQuizzesByType(parishId: string, tipo: "adulto" | "crianca"): Promise<Quiz[]> {
  try {
    const quizzes = await getParishQuizzes(parishId)
    return quizzes.filter((quiz) => quiz.tipo === tipo)
  } catch (error) {
    console.error(`Erro ao obter quizzes do tipo ${tipo}:`, error)
    return []
  }
}

// Funções relacionadas às respostas do Quiz
export async function saveQuizResponse(responseData: QuizResponse): Promise<string> {
  try {
    const id = `response:${Date.now()}`

    // Converte o objeto response para uma estrutura chave-valor plana
    const serializedResponse: Record<string, string> = {}

    // Serializa cada campo individualmente
    Object.entries(responseData).forEach(([key, value]) => {
      if (value !== undefined) {
        // Converte objetos/arrays para strings JSON
        if (typeof value === "object") {
          serializedResponse[key] = JSON.stringify(value)
        } else {
          serializedResponse[key] = String(value)
        }
      }
    })

    // Armazena os dados da resposta
    await kv.hset(id, serializedResponse)

    // Adiciona o ID da resposta ao conjunto de respostas do usuário
    await kv.sadd(`user:${responseData.userId}:responses`, id)

    // Adiciona o ID da resposta ao conjunto de respostas do quiz
    await kv.sadd(`quiz:${responseData.quizId}:responses`, id)

    return id
  } catch (error) {
    console.error("Erro ao salvar resposta do quiz:", error)
    throw error
  }
}

export async function getUserQuizResponses(userId: string): Promise<QuizResponse[]> {
  try {
    const responseIds = await kv.smembers(`user:${userId}:responses`)

    const responses = await Promise.all(
      responseIds.map(async (id) => {
        const response = await kv.hgetall(id)

        if (!response) return null

        // Converte valores de string de volta para seus tipos originais
        const parsedResponse: Record<string, any> = {}

        Object.entries(response).forEach(([key, value]) => {
          if (typeof value === "string") {
            try {
              // Tenta analisar strings JSON de volta para objetos/arrays
              parsedResponse[key] = JSON.parse(value)
            } catch {
              // Se não for JSON, mantém como está
              parsedResponse[key] = value
            }
          } else {
            parsedResponse[key] = value
          }
        })

        return { ...parsedResponse, id } as QuizResponse
      }),
    )

    return responses.filter(Boolean) as QuizResponse[]
  } catch (error) {
    console.error("Erro ao obter respostas do quiz do usuário:", error)
    return []
  }
}

export async function getQuizResponses(quizId: string): Promise<QuizResponse[]> {
  try {
    const responseIds = await kv.smembers(`quiz:${quizId}:responses`)

    const responses = await Promise.all(
      responseIds.map(async (id) => {
        const response = await kv.hgetall(id)

        if (!response) return null

        // Converte valores de string de volta para seus tipos originais
        const parsedResponse: Record<string, any> = {}

        Object.entries(response).forEach(([key, value]) => {
          if (typeof value === "string") {
            try {
              // Tenta analisar strings JSON de volta para objetos/arrays
              parsedResponse[key] = JSON.parse(value)
            } catch {
              // Se não for JSON, mantém como está
              parsedResponse[key] = value
            }
          } else {
            parsedResponse[key] = value
          }
        })

        return { ...parsedResponse, id } as QuizResponse
      }),
    )

    return responses.filter(Boolean) as QuizResponse[]
  } catch (error) {
    console.error("Erro ao obter respostas do quiz:", error)
    return []
  }
}

// Funções relacionadas aos convites
export async function createInvite(inviteData: Convite): Promise<string> {
  try {
    const id = `invite:${Date.now()}`

    // Converte o objeto convite para uma estrutura chave-valor plana
    const serializedInvite: Record<string, string> = {}

    // Serializa cada campo individualmente
    Object.entries(inviteData).forEach(([key, value]) => {
      if (value !== undefined) {
        // Converte objetos/arrays para strings JSON
        if (typeof value === "object") {
          serializedInvite[key] = JSON.stringify(value)
        } else {
          serializedInvite[key] = String(value)
        }
      }
    })

    // Armazena os dados do convite
    await kv.hset(id, serializedInvite)

    // Adiciona o ID do convite ao conjunto de convites da paróquia
    await kv.sadd(`parish:${inviteData.parishId}:invites`, id)

    return id
  } catch (error) {
    console.error("Erro ao criar convite:", error)
    throw error
  }
}

export async function getInviteByToken(token: string): Promise<Convite | null> {
  try {
    // Obter todos os convites (não é eficiente, mas funciona para um protótipo)
    const parishIds = await kv.smembers("parishes")

    for (const parishId of parishIds) {
      const inviteIds = await kv.smembers(`parish:${parishId}:invites`)

      for (const inviteId of inviteIds) {
        const invite = await kv.hgetall(inviteId)

        if (invite && invite.token === token) {
          // Converte valores de string de volta para seus tipos originais
          const parsedInvite: Record<string, any> = {}

          Object.entries(invite).forEach(([key, value]) => {
            if (typeof value === "string") {
              try {
                // Tenta analisar strings JSON de volta para objetos/arrays
                parsedInvite[key] = JSON.parse(value)
              } catch {
                // Se não for JSON, mantém como está
                parsedInvite[key] = value
              }
            } else {
              parsedInvite[key] = value
            }
          })

          return { ...parsedInvite, id: inviteId } as Convite
        }
      }
    }

    return null
  } catch (error) {
    console.error("Erro ao obter convite por token:", error)
    return null
  }
}

export async function markInviteAsUsed(inviteId: string): Promise<boolean> {
  try {
    await kv.hset(inviteId, { usado: "true" })
    return true
  } catch (error) {
    console.error("Erro ao marcar convite como usado:", error)
    return false
  }
}

export async function getParishInvites(parishId: string): Promise<Convite[]> {
  try {
    const inviteIds = await kv.smembers(`parish:${parishId}:invites`)

    const invites = await Promise.all(
      inviteIds.map(async (id) => {
        const invite = await kv.hgetall(id)

        if (!invite) return null

        // Converte valores de string de volta para seus tipos originais
        const parsedInvite: Record<string, any> = {}

        Object.entries(invite).forEach(([key, value]) => {
          if (typeof value === "string") {
            try {
              // Tenta analisar strings JSON de volta para objetos/arrays
              parsedInvite[key] = JSON.parse(value)
            } catch {
              // Se não for JSON, mantém como está
              parsedInvite[key] = value
            }
          } else {
            parsedInvite[key] = value
          }
        })

        return { ...parsedInvite, id } as Convite
      }),
    )

    return invites.filter(Boolean) as Convite[]
  } catch (error) {
    console.error("Erro ao obter convites da paróquia:", error)
    return []
  }
}

export async function getPendingQuizzesForUser(userId: string): Promise<Quiz[]> {
  try {
    const user = await getUser(userId)
    if (!user || !user.parishId) {
      return []
    }

    // Obter todos os quizzes da paróquia
    const parishQuizzes = await getParishQuizzes(user.parishId)
    
    // Obter todas as respostas do usuário
    const userResponses = await getUserQuizResponses(userId)
    const respondedQuizIds = userResponses.map(response => response.quizId)
    
    // Filtrar quizzes pendentes (que o usuário não respondeu e ainda estão ativos)
    const pendingQuizzes = parishQuizzes.filter(quiz => {
      // Verificar se o quiz é do tipo adequado para o usuário
      const isCorrectType = user.tipo ? quiz.tipo === user.tipo : true
      
      // Verificar se o quiz ainda não foi respondido pelo usuário
      const isNotAnswered = !respondedQuizIds.includes(quiz.id!)
      
      // Verificar se o quiz não expirou
      const isNotExpired = quiz.expiraEm > Date.now()
      
      // Verificar se o status é "pendente" ou "ativo"
      const isActive = quiz.status === "pendente" || quiz.status === "ativo"
      
      return isCorrectType && isNotAnswered && isNotExpired && isActive
    })
    
    return pendingQuizzes
  } catch (error) {
    console.error("Erro ao obter quizzes pendentes para o usuário:", error)
    return []
  }
}

export async function updateExpiredQuizzes(parishId: string): Promise<void> {
  try {
    const parishQuizzes = await getParishQuizzes(parishId)
    const now = Date.now()
    
    // Identifica quizzes expirados que ainda não estão com status "encerrado"
    const expiredQuizzes = parishQuizzes.filter(quiz => 
      quiz.expiraEm < now && quiz.status !== "encerrado"
    )
    
    // Atualiza o status dos quizzes expirados para "encerrado"
    for (const quiz of expiredQuizzes) {
      if (quiz.id) {
        await kv.hset(quiz.id, { status: "encerrado" })
      }
    }
    
    console.log(`Atualizados ${expiredQuizzes.length} quizzes expirados para a paróquia ${parishId}`)
  } catch (error) {
    console.error("Erro ao atualizar quizzes expirados:", error)
  }
}

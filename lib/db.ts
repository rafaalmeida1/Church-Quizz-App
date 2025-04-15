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

export async function repairQuiz(quizId: string): Promise<boolean> {
  try {
    if (!quizId) return false;
    
    console.log(`Attempting to repair quiz: ${quizId}`);
    
    // Get the raw quiz data without processing
    const rawQuiz = await kv.hgetall(quizId);
    
    if (!rawQuiz || Object.keys(rawQuiz).length === 0) {
      console.log(`Quiz not found or empty: ${quizId}`);
      return false;
    }
    
    // Create a clean quiz object with valid structure
    const cleanQuiz: Record<string, any> = {
      id: quizId,
      titulo: rawQuiz.titulo || "Quiz sem título",
      descricao: rawQuiz.descricao || "Sem descrição",
      tema: rawQuiz.tema || "Tema não especificado",
      tipo: rawQuiz.tipo || "adulto",
      parishId: rawQuiz.parishId || "",
      criadoPor: rawQuiz.criadoPor || "",
      criadoEm: rawQuiz.criadoEm || Date.now().toString(),
      status: rawQuiz.status || "encerrado",
      questoes: [],
    };
    
    // Try to parse questoes if it exists
    if (rawQuiz.questoes) {
      try {
        // Check if questoes is already an object or a string that needs parsing
        const questoesData = typeof rawQuiz.questoes === 'string' 
          ? JSON.parse(rawQuiz.questoes) 
          : rawQuiz.questoes;
        
        if (Array.isArray(questoesData)) {
          cleanQuiz.questoes = questoesData;
        } else {
          cleanQuiz.questoes = [];
        }
      } catch (e) {
        console.error(`Failed to parse questoes for quiz ${quizId}:`, e);
        cleanQuiz.questoes = [];
      }
    }
    
    // Add expiraEm if missing
    if (!rawQuiz.expiraEm) {
      // Set to 7 days from creation date or now if not available
      const creationDate = parseInt(cleanQuiz.criadoEm) || Date.now();
      cleanQuiz.expiraEm = (creationDate + 7 * 24 * 60 * 60 * 1000).toString();
    } else {
      cleanQuiz.expiraEm = rawQuiz.expiraEm;
    }
    
    // Prepare data for storage (convert objects to JSON strings)
    const serializedQuiz: Record<string, string> = {};
    Object.entries(cleanQuiz).forEach(([key, value]) => {
      if (value !== undefined) {
        if (typeof value === "object") {
          serializedQuiz[key] = JSON.stringify(value);
        } else {
          serializedQuiz[key] = String(value);
        }
      }
    });
    
    // Delete the old quiz data
    await kv.del(String(quizId));
    
    // Store the repaired data
    await kv.hset(quizId, serializedQuiz);
    
    console.log(`Successfully repaired quiz: ${quizId}`);
    return true;
  } catch (error) {
    console.error(`Error repairing quiz ${quizId}:`, error);
    return false;
  }
}

export async function getQuiz(id: string): Promise<Quiz | null> {
  try {
    if (!id) {
      console.warn("getQuiz: id is undefined or empty");
      return null;
    }

    // Try to get quiz data
    let quiz;
    let repaired = false;
    
    try {
      quiz = await kv.hgetall(id);
    } catch (fetchError) {
      console.error(`Error fetching quiz ${id}:`, fetchError);
      
      // Try to repair the quiz
      const repairSuccess = await repairQuiz(id);
      if (repairSuccess) {
        repaired = true;
        // Try fetching again after repair
        try {
          quiz = await kv.hgetall(id);
        } catch (secondError) {
          console.error(`Failed to fetch quiz ${id} even after repair:`, secondError);
          return null;
        }
      } else {
        return null;
      }
    }

    if (!quiz || Object.keys(quiz).length === 0) {
      // If not already tried, attempt to repair
      if (!repaired) {
        const repairSuccess = await repairQuiz(id);
        if (repairSuccess) {
          // Try fetching again after repair
          try {
            quiz = await kv.hgetall(id);
            if (!quiz || Object.keys(quiz).length === 0) {
              return null;
            }
          } catch (error) {
            console.error(`Failed to fetch quiz ${id} after repair:`, error);
            return null;
          }
        } else {
          return null;
        }
      } else {
        return null;
      }
    }

    // Convert values safely
    const parsedQuiz: Record<string, any> = {
      id: id,
      titulo: quiz.titulo || "Quiz sem título",
      status: quiz.status || "encerrado",
    };

    // Process each field carefully
    Object.entries(quiz).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      
      if (typeof value === "string") {
        try {
          // Try to parse as JSON
          parsedQuiz[key] = JSON.parse(value);
        } catch {
          // Keep as string if not JSON
          parsedQuiz[key] = value;
        }
      } else {
        parsedQuiz[key] = value;
      }
    });

    // Ensure we have required fields with defaults
    if (!parsedQuiz.questoes) parsedQuiz.questoes = [];
    if (!parsedQuiz.expiraEm) {
      const creationDate = parseInt(parsedQuiz.criadoEm) || Date.now();
      parsedQuiz.expiraEm = creationDate + 7 * 24 * 60 * 60 * 1000;
    } else if (typeof parsedQuiz.expiraEm === 'string') {
      parsedQuiz.expiraEm = parseInt(parsedQuiz.expiraEm);
    }

    return parsedQuiz as Quiz;
  } catch (error) {
    console.error("Error in getQuiz:", error, "ID:", id);
    return null;
  }
}

export async function getParishQuizzes(parishId: string): Promise<Quiz[]> {
  try {
    if (!parishId) {
      console.warn("getParishQuizzes: parishId is undefined or empty");
      return [];
    }
    
    const quizIds = await kv.smembers(`parish:${parishId}:quizzes`) || [];
    
    if (!quizIds || quizIds.length === 0) {
      return [];
    }

    const quizzes = await Promise.all(
      quizIds.map(async (id) => {
        try {
          if (!id) return null;
          
          const quiz = await getQuiz(id);
          return quiz ? { ...quiz, id } : null;
        } catch (error) {
          console.error("Erro ao processar quiz individual:", error, "ID:", id);
          return null;
        }
      })
    );

    return quizzes.filter(Boolean) as Quiz[];
  } catch (error) {
    console.error("Erro ao obter quizzes da paróquia:", error, "ParishID:", parishId);
    return [];
  }
}

export async function getQuizzesByType(parishId: string, tipo: "adulto" | "crianca"): Promise<Quiz[]> {
  try {
    if (!parishId) {
      console.warn("getQuizzesByType: parishId is undefined or empty");
      return [];
    }
    
    const quizzes = await getParishQuizzes(parishId);
    
    if (!quizzes || !Array.isArray(quizzes)) {
      console.warn("getQuizzesByType: quizzes is not an array", quizzes);
      return [];
    }
    
    return quizzes.filter((quiz) => {
      if (!quiz) return false;
      return quiz.tipo === tipo;
    });
  } catch (error) {
    console.error(`Erro ao obter quizzes do tipo ${tipo}:`, error, "ParishID:", parishId);
    return [];
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
    if (!quizId) {
      console.warn("getQuizResponses: quizId is undefined or empty");
      return [];
    }
    
    const formattedQuizId = quizId.startsWith('quiz:') ? quizId : `quiz:${quizId}`;
    
    try {
      const responseIds = await kv.smembers(`${formattedQuizId}:responses`);
      
      if (!responseIds || !Array.isArray(responseIds) || responseIds.length === 0) {
        console.log(`No responses found for quiz: ${formattedQuizId}`);
        return [];
      }
      
      // Safe mapping with null/undefined checks
      const responsesPromises = responseIds.map(async (id) => {
        if (!id) return null;
        
        try {
          const response = await kv.hgetall(id);
          if (!response || Object.keys(response).length === 0) return null;
          
          // Safe conversion of values
          const parsedResponse: Record<string, any> = {};
          
          Object.entries(response).forEach(([key, value]) => {
            if (value === null || value === undefined) return;
            
            if (typeof value === "string") {
              try {
                parsedResponse[key] = JSON.parse(value);
              } catch {
                parsedResponse[key] = value;
              }
            } else {
              parsedResponse[key] = value;
            }
          });
          
          return { ...parsedResponse, id } as QuizResponse;
        } catch (responseError) {
          console.error("Error processing response:", responseError, "ID:", id);
          return null;
        }
      });
      
      // Handle Promise.all safely
      const responses = await Promise.all(responsesPromises || []);
      
      // Filter out null/undefined values
      return (responses || []).filter(Boolean) as QuizResponse[];
    } catch (innerError) {
      console.error("Error getting response IDs:", innerError, "QuizID:", quizId);
      return [];
    }
  } catch (error) {
    console.error("Error in getQuizResponses:", error, "QuizID:", quizId);
    return [];
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
    if (!parishId) {
      console.warn("updateExpiredQuizzes: parishId is undefined or empty");
      return;
    }
    
    const parishQuizzes = await getParishQuizzes(parishId);
    
    if (!parishQuizzes || !Array.isArray(parishQuizzes) || parishQuizzes.length === 0) {
      console.log(`No quizzes found for parish: ${parishId}`);
      return;
    }
    
    const now = Date.now();
    
    // Identifica quizzes expirados que ainda não estão com status "encerrado"
    const expiredQuizzes = parishQuizzes.filter(quiz => 
      quiz && quiz.expiraEm && quiz.expiraEm < now && quiz.status !== "encerrado"
    );
    
    if (!expiredQuizzes || expiredQuizzes.length === 0) {
      console.log(`No expired quizzes to update for parish: ${parishId}`);
      return;
    }
    
    // Atualiza o status dos quizzes expirados para "encerrado"
    for (const quiz of expiredQuizzes) {
      if (quiz && quiz.id) {
        try {
          await kv.hset(quiz.id, { status: "encerrado" });
        } catch (updateError) {
          console.error(`Error updating expired quiz: ${quiz.id}`, updateError);
        }
      }
    }
    
    console.log(`Updated ${expiredQuizzes.length} expired quizzes for parish: ${parishId}`);
  } catch (error) {
    console.error("Error updating expired quizzes:", error, "ParishID:", parishId);
  }
}

export async function repairParishQuizzes(parishId: string): Promise<{total: number, repaired: number, failed: number}> {
  try {
    console.log(`Starting repair of all quizzes for parish: ${parishId}`);
    
    if (!parishId) {
      console.warn("repairParishQuizzes: parishId is undefined or empty");
      return { total: 0, repaired: 0, failed: 0 };
    }
    
    const quizIds = await kv.smembers(`parish:${parishId}:quizzes`) || [];
    
    if (!quizIds || !Array.isArray(quizIds) || quizIds.length === 0) {
      console.log(`No quizzes found for parish: ${parishId}`);
      return { total: 0, repaired: 0, failed: 0 };
    }
    
    console.log(`Found ${quizIds.length} quizzes to check for parish: ${parishId}`);
    
    let repaired = 0;
    let failed = 0;
    
    // Process quizzes one by one to avoid overwhelming the KV store
    for (const quizId of quizIds) {
      try {
        // Try to get quiz first to see if it needs repair
        let needsRepair = false;
        try {
          const quiz = await kv.hgetall(quizId);
          if (!quiz || Object.keys(quiz).length === 0) {
            needsRepair = true;
          } else if (!quiz.questoes || !quiz.expiraEm) {
            needsRepair = true;
          }
        } catch (error) {
          needsRepair = true;
        }
        
        if (needsRepair) {
          console.log(`Quiz ${quizId} needs repair, attempting...`);
          const success = await repairQuiz(quizId);
          if (success) {
            repaired++;
            console.log(`Quiz ${quizId} repaired successfully`);
          } else {
            failed++;
            console.error(`Failed to repair quiz ${quizId}`);
          }
        }
      } catch (error) {
        failed++;
        console.error(`Error processing quiz ${quizId}:`, error);
      }
    }
    
    console.log(`Parish ${parishId} repair complete: ${repaired} repaired, ${failed} failed, ${quizIds.length} total`);
    return {
      total: quizIds.length,
      repaired,
      failed
    };
  } catch (error) {
    console.error(`Error repairing parish quizzes:`, error, "ParishID:", parishId);
    return { total: 0, repaired: 0, failed: 0 };
  }
}

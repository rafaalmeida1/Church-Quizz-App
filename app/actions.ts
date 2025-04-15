"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import {
  createParish,
  createUser,
  createQuiz,
  saveQuizResponse,
  getUser,
  getUserByEmail,
  createInvite,
  getInviteByToken,
  markInviteAsUsed,
  getQuiz,
} from "@/lib/db"
import { hashPassword, comparePasswords, createSession, logout as logoutUser, getSession } from "@/lib/auth"
import { generateQuizQuestions } from "@/lib/ai"
import type { Parish, User, Quiz, QuizResponse, Convite, UserRole, CatequistaType, WeeklyXPGoal, UserXPStats } from "@/lib/types"
import { XP_PER_QUIZ_COMPLETION, XP_PER_CORRECT_ANSWER, XP_STREAK_BONUS } from "@/lib/types"
import crypto from "crypto"
import { kv } from "@vercel/kv"

export async function registerParish(formData: FormData) {
  try {
    const parish: Parish = {
      nome: formData.get("nome") as string,
      endereco: formData.get("endereco") as string,
      cidade: formData.get("cidade") as string,
      estado: formData.get("estado") as string,
      cep: formData.get("cep") as string,
      telefone: formData.get("telefone") as string,
      email: formData.get("email") as string,
      website: (formData.get("website") as string) || undefined,
      criadoEm: Date.now(),
    }

    // Cria a paróquia
    const parishId = await createParish(parish)

    // Cria o usuário administrador
    const hashedPassword = await hashPassword(formData.get("password") as string)

    const adminUser: User = {
      nome: formData.get("adminNome") as string,
      email: formData.get("adminEmail") as string,
      password: hashedPassword,
      role: "admin",
      parishId,
      criadoEm: Date.now(),
    }

    const userId = await createUser(adminUser)
    const user = await getUser(userId)

    if (user) {
      const token = await createSession(user)
      const cookieStore = await cookies()
      cookieStore.set("auth-token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 1 semana
        path: "/",
      })
    }

    return { success: true, parishId }
  } catch (error) {
    console.error("Erro ao registrar paróquia:", error)
    return { success: false, error: "Falha ao registrar paróquia" }
  }
}

export async function login(formData: FormData) {
  try {
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    const user = await getUserByEmail(email)

    if (!user) {
      return { success: false, error: "Usuário não encontrado" }
    }

    const passwordMatch = await comparePasswords(password, user.password)

    if (!passwordMatch) {
      return { success: false, error: "Senha inválida" }
    }

    const token = await createSession(user)
    const cookieStore = await cookies()
    cookieStore.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 semana
      path: "/",
    })

    return { success: true, user }
  } catch (error) {
    console.error("Erro ao fazer login:", error)
    return { success: false, error: "Falha ao fazer login" }
  }
}

export async function logout() {
  await logoutUser()
  redirect("/login")
}

export async function createCatequista(formData: FormData) {
  try {
    const parishId = formData.get("parishId") as string
    const hashedPassword = await hashPassword(formData.get("password") as string)
    const tipo = formData.get("tipo") as CatequistaType

    const catequistaUser: User = {
      nome: formData.get("nome") as string,
      email: formData.get("email") as string,
      password: hashedPassword,
      role: "catequista",
      parishId,
      tipo,
      criadoEm: Date.now(),
    }

    const userId = await createUser(catequistaUser)
    return { success: true, userId }
  } catch (error) {
    console.error("Erro ao criar catequista:", error)
    return { success: false, error: "Falha ao criar catequista" }
  }
}

export async function createCatequisando(formData: FormData) {
  try {
    const parishId = formData.get("parishId") as string
    const hashedPassword = await hashPassword(formData.get("password") as string)
    const tipo = formData.get("tipo") as CatequistaType

    const catequisandoUser: User = {
      nome: formData.get("nome") as string,
      email: formData.get("email") as string,
      password: hashedPassword,
      role: "catequisando",
      parishId,
      tipo,
      criadoEm: Date.now(),
    }

    const userId = await createUser(catequisandoUser)

    // Se houver um token de convite, marque-o como usado
    const inviteToken = formData.get("inviteToken") as string
    if (inviteToken) {
      const invite = await getInviteByToken(inviteToken)
      if (invite && invite.id) {
        await markInviteAsUsed(invite.id)
      }
    }

    return { success: true, userId }
  } catch (error) {
    console.error("Erro ao criar catequisando:", error)
    return { success: false, error: "Falha ao criar catequisando" }
  }
}

export async function createQuizAction(formData: FormData) {
  try {
    const tema = formData.get("tema") as string
    const titulo = formData.get("titulo") as string
    const descricao = formData.get("descricao") as string
    const tipo = formData.get("tipo") as "adulto" | "crianca"
    const parishId = formData.get("parishId") as string
    const criadoPor = formData.get("criadoPor") as string

    // Gera questões usando IA
    const questoes = await generateQuizQuestions(tema, tipo)

    // Define a data de expiração para 7 dias a partir de agora
    const expiraEm = Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 dias em milissegundos

    const quiz: Quiz = {
      titulo,
      descricao,
      tema,
      tipo,
      parishId,
      criadoPor,
      questoes,
      criadoEm: Date.now(),
      expiraEm: expiraEm,
      status: "pendente",
      pontuacaoMaxima: questoes.length * 10, // 10 pontos por questão
    }

    const quizId = await createQuiz(quiz)
    return { success: true, quizId }
  } catch (error) {
    console.error("Erro ao criar quiz:", error)
    return { success: false, error: "Falha ao criar quiz" }
  }
}

export async function submitQuizResponse(
  data: FormData | { quizId: string; userId: string; answers: any[]; score: number; xp?: number }
) {
  try {
    let quizId: string;
    let userId: string;
    let respostas: any[];
    let pontuacao: number;
    let xp: number | undefined;

    if (data instanceof FormData) {
      quizId = data.get("quizId") as string;
      userId = data.get("userId") as string;
      const respostasJson = data.get("respostas") as string;
      pontuacao = Number.parseInt(data.get("pontuacao") as string);
      xp = data.get("xp") ? Number.parseInt(data.get("xp") as string) : undefined;
      
      // Validação dos campos obrigatórios
      if (!quizId || !userId || !respostasJson || isNaN(pontuacao)) {
        console.error("Dados inválidos na submissão da resposta do quiz", {
          quizId, userId, pontuacao, 
          respostasJsonPresent: !!respostasJson,
        });
        return { success: false, error: "Dados inválidos na submissão da resposta do quiz" };
      }

      respostas = JSON.parse(respostasJson);
    } else {
      // Caso de objeto de parâmetros
      quizId = data.quizId;
      userId = data.userId;
      respostas = data.answers;
      pontuacao = data.score;
      xp = data.xp;
      
      // Validação dos campos obrigatórios
      if (!quizId || !userId || !Array.isArray(respostas) || isNaN(pontuacao)) {
        console.error("Dados inválidos na submissão da resposta do quiz", {
          quizId, userId, pontuacao, 
          respostasPresent: Array.isArray(respostas),
        });
        return { success: false, error: "Dados inválidos na submissão da resposta do quiz" };
      }
    }

    const response: QuizResponse = {
      quizId,
      userId,
      respostas,
      pontuacao,
      completadoEm: Date.now(),
    }

    console.log("Salvando resposta do quiz:", {
      userId, quizId, pontuacao,
      respostasCount: respostas.length,
      xp
    })

    const responseId = await saveQuizResponse(response)
    
    // Atualizar o status do quiz para "ativo" se estiver "pendente"
    const quiz = await getQuiz(quizId)
    if (quiz && quiz.status === "pendente") {
      await kv.hset(quizId, { status: "ativo" })
      console.log(`Quiz ${quizId} atualizado para status 'ativo'`)
    }
    
    // Atualizar XP do usuário se fornecido
    if (xp && xp > 0) {
      // Calcular o número de questões com base nas respostas
      const totalQuestions = respostas.length;
      const correctAnswers = respostas.filter(r => r.estaCorreta).length;
      
      // Atualizar o XP do usuário
      await updateUserXP(userId, pontuacao, totalQuestions, xp);
      console.log(`XP do usuário ${userId} atualizado: +${xp} XP`);
    }
    
    return { success: true, responseId }
  } catch (error) {
    console.error("Erro ao enviar resposta do quiz:", error)
    return { success: false, error: "Falha ao enviar resposta do quiz" }
  }
}

export async function createInviteAction(formData: FormData) {
  try {
    const parishId = formData.get("parishId") as string
    const criadoPor = formData.get("criadoPor") as string
    const email = formData.get("email") as string
    const tipo = formData.get("tipo") as CatequistaType
    const mensagem = (formData.get("mensagem") as string) || ""

    // Gera um token único
    const token = crypto.randomBytes(32).toString("hex")

    // Define a data de expiração (30 dias a partir de agora)
    const expiraEm = Date.now() + 30 * 24 * 60 * 60 * 1000

    const convite: Convite = {
      parishId,
      criadoPor,
      email,
      tipo,
      token,
      criadoEm: Date.now(),
      expiraEm,
      usado: false,
    }

    const inviteId = await createInvite(convite)
    return {
      success: true,
      inviteId,
      token,
      tipo,
    }
  } catch (error) {
    console.error("Erro ao criar convite:", error)
    return { success: false, error: "Falha ao criar convite" }
  }
}

export async function validateInvite(token: string) {
  try {
    const invite = await getInviteByToken(token)

    if (!invite) {
      return { success: false, error: "Convite não encontrado" }
    }

    if (invite.usado) {
      return { success: false, error: "Este convite já foi utilizado" }
    }

    if (invite.expiraEm < Date.now()) {
      return { success: false, error: "Este convite expirou" }
    }

    return {
      success: true,
      invite: {
        parishId: invite.parishId,
        email: invite.email,
        tipo: invite.tipo,
      },
    }
  } catch (error) {
    console.error("Erro ao validar convite:", error)
    return { success: false, error: "Falha ao validar convite" }
  }
}

export async function getSessionData() {
  try {
    const { user, parishId } = await getSession()
    return { user, parishId }
  } catch (error) {
    console.error("Erro ao obter dados da sessão:", error)
    return { user: null, parishId: null }
  }
}

// Função para definir meta semanal de XP para um usuário
export async function setWeeklyXPGoal(userId: string, targetXP: number) {
  try {
    // Obter o início da semana atual (domingo às 00:00)
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Domingo, 1 = Segunda, etc.
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const weekStartTimestamp = startOfWeek.getTime();

    // Criar objeto de meta semanal
    const weeklyGoal: WeeklyXPGoal = {
      userId,
      weekStartDate: weekStartTimestamp,
      targetXP,
      currentXP: 0,
      completed: false
    };

    // Verificar se já existe uma meta para esta semana
    const existingGoalKey = `xp:goal:${userId}:${weekStartTimestamp}`;
    const existingGoal = await kv.get(existingGoalKey);
    
    if (existingGoal && typeof existingGoal === 'object' && 'value' in existingGoal && existingGoal.value) {
      // Atualizar meta existente, mantendo o XP atual
      const existingGoalData = JSON.parse(String(existingGoal.value));
      const updatedGoal = {
        ...existingGoalData,
        targetXP
      };
      await kv.set(existingGoalKey, JSON.stringify(updatedGoal));
      return { success: true, goal: updatedGoal };
    }

    // Salvar nova meta no banco de dados
    await kv.set(`xp:goal:${userId}:${weekStartTimestamp}`, JSON.stringify(weeklyGoal));
    
    return { success: true, goal: weeklyGoal };
  } catch (error) {
    console.error("Erro ao definir meta semanal de XP:", error);
    return { success: false, error: "Falha ao definir meta semanal de XP" };
  }
}

// Função para obter a meta semanal atual de um usuário
export async function getCurrentWeeklyXPGoal(userId: string) {
  try {
    // Obter o início da semana atual
    const now = new Date();
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const weekStartTimestamp = startOfWeek.getTime();
    
    // Buscar meta atual do banco de dados
    const goalKey = `xp:goal:${userId}:${weekStartTimestamp}`;
    const storedGoal = await kv.get(goalKey);
    
    if (!storedGoal || typeof storedGoal !== 'object' || !('value' in storedGoal) || !storedGoal.value) {
      // Criar meta padrão se não existir
      const defaultGoal: WeeklyXPGoal = {
        userId,
        weekStartDate: weekStartTimestamp,
        targetXP: 50, // Meta padrão de 50 XP por semana
        currentXP: 0,
        completed: false
      };
      
      await kv.set(goalKey, JSON.stringify(defaultGoal));
      return defaultGoal;
    }
    
    return JSON.parse(String(storedGoal.value)) as WeeklyXPGoal;
  } catch (error) {
    console.error("Erro ao obter meta semanal de XP:", error);
    return null;
  }
}

// Função para atualizar o XP de um usuário após concluir um quiz
export async function updateUserXP(
  userId: string, 
  quizScore: number, 
  totalQuestions: number,
  xpValue?: number
) {
  try {
    // Obter o XP atual do usuário
    const userXPKey = `user:${userId}:xp`;
    const userXPData = await kv.get(userXPKey);
    
    // Inicializar estatísticas de XP padrão se não existirem
    let userStats: UserXPStats = {
      userId,
      totalXP: 0,
      weeklyXP: 0,
      lastUpdated: Date.now(),
      level: 1,
    };
    
    if (userXPData && typeof userXPData === 'object' && 'value' in userXPData && userXPData.value) {
      userStats = JSON.parse(String(userXPData.value));
    }
    
    // Calcular o XP ganho com o quiz
    let xpEarned = xpValue;
    
    if (!xpEarned) {
      // Se não for fornecido o valor de XP, calcular com base na pontuação e número de questões
      const baseXP = 10; // XP base por completar um quiz
      const correctAnswersXP = Math.round((quizScore / 100) * totalQuestions * 5); // 5 XP por resposta correta
      xpEarned = baseXP + correctAnswersXP;
    }
    
    // Atualizar o XP total do usuário
    userStats.totalXP += xpEarned;
    userStats.weeklyXP += xpEarned;
    userStats.lastUpdated = Date.now();
    
    // Recalcular o nível com base no novo XP total
    userStats.level = calculateLevel(userStats.totalXP);
    
    // Salvar as estatísticas atualizadas
    await kv.set(userXPKey, JSON.stringify(userStats));
    
    // Atualizar a meta semanal de XP, se existir
    const now = new Date();
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    const weekStartTimestamp = startOfWeek.getTime();
    
    const weeklyGoalKey = `xp:goal:${userId}:${weekStartTimestamp}`;
    const weeklyGoalData = await kv.get(weeklyGoalKey);
    
    let weeklyGoal = null;
    
    if (weeklyGoalData && typeof weeklyGoalData === 'object' && 'value' in weeklyGoalData && weeklyGoalData.value) {
      weeklyGoal = JSON.parse(String(weeklyGoalData.value));
      weeklyGoal.currentXP += xpEarned;
      
      // Verificar se a meta foi atingida
      if (!weeklyGoal.completed && weeklyGoal.currentXP >= weeklyGoal.targetXP) {
        weeklyGoal.completed = true;
      }
      
      await kv.set(weeklyGoalKey, JSON.stringify(weeklyGoal));
    }
    
    return {
      success: true,
      xpEarned,
      totalXP: userStats.totalXP,
      level: userStats.level,
      weeklyGoal
    };
  } catch (error) {
    console.error("Erro ao atualizar XP do usuário:", error);
    return { success: false, error: "Falha ao atualizar XP do usuário" };
  }
}

// Função para calcular o nível baseado no XP total
function calculateLevel(xp: number): number {
  // Fórmula: cada nível requer XP adicional
  // Nível 1: 0-99 XP
  // Nível 2: 100-299 XP
  // Nível 3: 300-599 XP
  // etc.
  if (xp < 100) return 1;
  if (xp < 300) return 2;
  if (xp < 600) return 3;
  if (xp < 1000) return 4;
  if (xp < 1500) return 5;
  if (xp < 2100) return 6;
  if (xp < 2800) return 7;
  if (xp < 3600) return 8;
  if (xp < 4500) return 9;
  return 10 + Math.floor((xp - 4500) / 1000);
}

// Função para obter o XP necessário para o próximo nível
export async function getXPForNextLevel(currentLevel: number): Promise<number> {
  switch (currentLevel) {
    case 1: return 100;
    case 2: return 300;
    case 3: return 600;
    case 4: return 1000;
    case 5: return 1500;
    case 6: return 2100;
    case 7: return 2800;
    case 8: return 3600;
    case 9: return 4500;
    default: return (currentLevel - 10) * 1000 + 5500;
  }
}

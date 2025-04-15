export type UserRole = "admin" | "catequista" | "catequisando"
export type QuizType = "adulto" | "crianca"
export type CatequistaType = "adulto" | "crianca"

export interface Parish {
  id?: string
  nome: string
  endereco: string
  cidade: string
  estado: string
  cep: string
  telefone: string
  email: string
  website?: string
  criadoEm: number
}

export interface User {
  id?: string
  nome: string
  email: string
  password: string // Senha criptografada
  role: UserRole
  parishId: string
  tipo?: CatequistaType // Tipo de catequista (adulto ou criança)
  criadoEm: number
}

export interface Quiz {
  id?: string
  titulo: string
  descricao: string
  tema: string
  tipo: QuizType
  parishId: string
  criadoPor: string // ID do usuário
  questoes: Question[]
  criadoEm: number
  expiraEm: number  // Data em que o quiz expira (obrigatório agora)
  status: "pendente" | "ativo" | "encerrado"  // Status do quiz
  pontuacaoMaxima?: number // Pontuação máxima possível
}

export interface Question {
  id: string
  texto: string
  opcoes: string[]
  opcaoCorreta: number
}

export interface QuizResponse {
  id?: string
  quizId: string
  userId: string
  respostas: Answer[]
  pontuacao: number
  completadoEm: number
}

export interface Answer {
  questionId: string
  opcaoSelecionada: number
  estaCorreta: boolean
}

export interface Convite {
  id?: string
  parishId: string
  criadoPor: string // ID do catequista
  email: string
  tipo: CatequistaType
  token: string
  criadoEm: number
  expiraEm: number
  usado: boolean
}

export interface WeeklyXPGoal {
  userId: string;
  weekStartDate: number; // timestamp em milissegundos (início da semana)
  targetXP: number;
  currentXP: number;
  completed: boolean;
}

export interface UserXPStats {
  userId: string;
  totalXP: number;
  weeklyXP: number;
  lastUpdated: number;
  level: number;
}

// Constantes para cálculo de XP
export const XP_PER_QUIZ_COMPLETION = 10;
export const XP_PER_CORRECT_ANSWER = 5;
export const XP_STREAK_BONUS = 10; 

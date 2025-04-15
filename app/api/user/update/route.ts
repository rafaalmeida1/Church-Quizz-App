import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { kv } from '@vercel/kv'
import { getUser } from '@/lib/db'

export async function POST(request: Request) {
  try {
    // Verificar autenticação
    const { user } = await getSession()
    if (!user || !user.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Usuário não autenticado' 
      }, { status: 401 })
    }
    
    // Obter dados da requisição
    const data = await request.json()
    const { nome, email } = data
    
    if (!nome || !email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Nome e email são obrigatórios' 
      }, { status: 400 })
    }
    
    // Verificar se o email já está em uso por outro usuário
    if (email !== user.email) {
      const existingUser = await getUser(user.id)
      if (existingUser && existingUser.email === email && existingUser.id !== user.id) {
        return NextResponse.json({ 
          success: false, 
          error: 'Este email já está em uso' 
        }, { status: 400 })
      }
    }
    
    // Atualizar usuário
    const userId = user.id
    await kv.hset(userId, { 
      nome, 
      email 
    })
    
    return NextResponse.json({ 
      success: true, 
      message: 'Perfil atualizado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Falha ao atualizar perfil',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 
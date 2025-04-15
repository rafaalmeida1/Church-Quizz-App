import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { kv } from '@vercel/kv'
import { hashPassword } from '@/lib/auth'

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
    const { password, currentPassword } = data
    
    if (!password) {
      return NextResponse.json({ 
        success: false, 
        error: 'Nova senha é obrigatória' 
      }, { status: 400 })
    }
    
    // Validar complexidade da senha
    if (password.length < 6) {
      return NextResponse.json({ 
        success: false, 
        error: 'A senha deve ter pelo menos 6 caracteres' 
      }, { status: 400 })
    }
    
    // Gerar hash da nova senha
    const hashedPassword = await hashPassword(password)
    
    // Atualizar senha do usuário
    const userId = user.id
    await kv.hset(userId, { 
      password: hashedPassword 
    })
    
    return NextResponse.json({ 
      success: true, 
      message: 'Senha atualizada com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar senha:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Falha ao atualizar senha',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 
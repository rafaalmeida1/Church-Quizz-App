import { NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import { getSession } from '@/lib/auth'
import { getUser } from '@/lib/db'

export async function POST(request: Request) {
  try {
    // Verificar autenticação
    const { user, parishId } = await getSession()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Acesso não autorizado' 
      }, { status: 403 })
    }
    
    if (!parishId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Usuário não está associado a uma paróquia' 
      }, { status: 400 })
    }
    
    // Receber dados do corpo da requisição
    const data = await request.json()
    const { userId, operation } = data
    
    if (!userId || !operation) {
      return NextResponse.json({ 
        success: false, 
        error: 'Parâmetros inválidos' 
      }, { status: 400 })
    }
    
    // Verificar se o usuário existe
    const targetUser = await getUser(userId)
    if (!targetUser) {
      return NextResponse.json({ 
        success: false, 
        error: 'Usuário não encontrado' 
      }, { status: 404 })
    }
    
    // Executar operação
    let result
    switch (operation) {
      case 'associarParoquia':
        // Adicionar usuário à paróquia
        result = await kv.sadd(`parish:${parishId}:users`, userId)
        break
        
      case 'desassociarParoquia':
        // Remover usuário da paróquia
        result = await kv.srem(`parish:${parishId}:users`, userId)
        break
        
      case 'converterParaCatequista':
        // Atualizar papel do usuário para catequista
        await kv.hset(userId, { role: 'catequista' })
        result = true
        break
        
      case 'converterParaCatequisando':
        // Atualizar papel do usuário para catequisando
        await kv.hset(userId, { role: 'catequisando' })
        result = true
        break
        
      default:
        return NextResponse.json({ 
          success: false, 
          error: 'Operação desconhecida' 
        }, { status: 400 })
    }
    
    return NextResponse.json({
      success: true,
      operation,
      userId,
      result
    })
  } catch (error) {
    console.error('Erro ao executar operação:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Falha ao executar operação',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 
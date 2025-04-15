import { NextResponse } from 'next/server'
import { getParishUsers, getUser } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { kv } from '@vercel/kv'

export async function GET() {
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
    
    // Obter todos os usuários da paróquia
    const usuarios = await getParishUsers(parishId)
    
    // Obter IDs de usuários da paróquia diretamente do Redis para verificação
    const userIdsFromRedis = await kv.smembers(`parish:${parishId}:users`)
    
    // Estatísticas gerais
    const estatisticas = {
      total: usuarios.length,
      porTipo: {
        admin: usuarios.filter(u => u.role === 'admin').length,
        catequista: usuarios.filter(u => u.role === 'catequista').length,
        catequisando: usuarios.filter(u => u.role === 'catequisando').length,
      },
      catequistasAdultos: usuarios.filter(u => u.role === 'catequista' && u.tipo === 'adulto').length,
      catequistasCriancas: usuarios.filter(u => u.role === 'catequista' && u.tipo === 'crianca').length,
    }
    
    // Informações resumidas dos usuários
    const usuariosSimplificados = usuarios.map(u => ({
      id: u.id,
      nome: u.nome,
      email: u.email,
      role: u.role,
      tipo: u.tipo,
      criadoEm: new Date(u.criadoEm).toISOString()
    }))
    
    return NextResponse.json({
      success: true,
      parishId,
      estatisticas,
      usuarios: usuariosSimplificados,
      rawUserIds: userIdsFromRedis,
      totalRawUserIds: userIdsFromRedis.length
    })
  } catch (error) {
    console.error('Erro ao diagnosticar usuários:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Falha ao listar usuários',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 
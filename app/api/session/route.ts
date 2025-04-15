import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const { user, parishId } = await getSession()
    
    return NextResponse.json({ 
      success: true, 
      user, 
      parishId 
    })
  } catch (error) {
    console.error('Erro ao obter dados da sessão:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Falha ao obter dados da sessão' 
    }, { status: 401 })
  }
} 
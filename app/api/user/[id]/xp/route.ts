import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { kv } from "@vercel/kv"
import { UserXPStats } from "@/lib/types"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await getSession()
    
    // Check if user is logged in
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 }
      )
    }
    
    const userId = params.id
    
    // Only allow users to get their own XP stats or admins/catequistas to get anyone's
    if (user.id !== userId && user.role !== "admin" && user.role !== "catequista") {
      return NextResponse.json(
        { success: false, error: "Acesso negado" },
        { status: 403 }
      )
    }
    
    // Get XP stats from Redis
    const userXPKey = `user:${userId}:xp`
    const xpData = await kv.get(userXPKey)
    
    let xpStats: UserXPStats = {
      userId,
      totalXP: 0,
      weeklyXP: 0,
      lastUpdated: Date.now(),
      level: 1
    }
    
    if (xpData && typeof xpData === 'object' && 'value' in xpData && xpData.value) {
      xpStats = JSON.parse(String(xpData.value))
    }
    
    // Get current weekly goal if available
    const now = new Date()
    const dayOfWeek = now.getDay()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - dayOfWeek)
    startOfWeek.setHours(0, 0, 0, 0)
    const weekStartTimestamp = startOfWeek.getTime()
    
    const weeklyGoalKey = `xp:goal:${userId}:${weekStartTimestamp}`
    const weeklyGoalData = await kv.get(weeklyGoalKey)
    
    let weeklyGoal = null
    
    if (weeklyGoalData && typeof weeklyGoalData === 'object' && 'value' in weeklyGoalData && weeklyGoalData.value) {
      weeklyGoal = JSON.parse(String(weeklyGoalData.value))
    }
    
    return NextResponse.json({
      success: true,
      stats: xpStats,
      weeklyGoal
    })
  } catch (error) {
    console.error("Erro ao buscar estatísticas de XP:", error)
    return NextResponse.json(
      { success: false, error: "Falha ao buscar estatísticas de XP" },
      { status: 500 }
    )
  }
} 
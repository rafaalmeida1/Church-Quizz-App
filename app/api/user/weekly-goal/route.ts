import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { kv } from "@vercel/kv"
import { WeeklyXPGoal } from "@/lib/types"

// GET endpoint to fetch a user's current weekly goal
export async function GET(request: NextRequest) {
  try {
    const { user } = await getSession()
    
    // Check if user is logged in
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 }
      )
    }
    
    // Get userId from query parameter
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId') || user.id
    
    // Only allow users to get their own goal or admins/catequistas to get anyone's
    if (user.id !== userId && user.role !== "admin" && user.role !== "catequista") {
      return NextResponse.json(
        { success: false, error: "Acesso negado" },
        { status: 403 }
      )
    }
    
    // Get current weekly start date
    const now = new Date()
    const dayOfWeek = now.getDay() // 0 = Domingo, 1 = Segunda, etc.
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - dayOfWeek)
    startOfWeek.setHours(0, 0, 0, 0)
    const weekStartTimestamp = startOfWeek.getTime()
    
    // Get weekly goal from Redis
    const weeklyGoalKey = `xp:goal:${userId}:${weekStartTimestamp}`
    const goalData = await kv.get(weeklyGoalKey)
    
    if (!goalData || typeof goalData !== 'object' || !('value' in goalData) || !goalData.value) {
      return NextResponse.json({
        success: true,
        goal: null
      })
    }
    
    const goal = JSON.parse(String(goalData.value))
    
    return NextResponse.json({
      success: true,
      goal
    })
  } catch (error) {
    console.error("Erro ao buscar meta semanal:", error)
    return NextResponse.json(
      { success: false, error: "Falha ao buscar meta semanal" },
      { status: 500 }
    )
  }
}

// POST endpoint to set a new weekly goal
export async function POST(request: NextRequest) {
  try {
    const { user } = await getSession()
    
    // Check if user is logged in
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 }
      )
    }
    
    // Get request body
    const body = await request.json()
    const { userId, targetXP } = body
    
    // Validate required fields
    if (!userId || !targetXP || targetXP < 0) {
      return NextResponse.json(
        { success: false, error: "Dados inválidos" },
        { status: 400 }
      )
    }
    
    // Only allow users to set their own goal or admins/catequistas to set anyone's
    if (user.id !== userId && user.role !== "admin" && user.role !== "catequista") {
      return NextResponse.json(
        { success: false, error: "Acesso negado" },
        { status: 403 }
      )
    }
    
    // Get current weekly start date
    const now = new Date()
    const dayOfWeek = now.getDay() // 0 = Domingo, 1 = Segunda, etc.
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - dayOfWeek)
    startOfWeek.setHours(0, 0, 0, 0)
    const weekStartTimestamp = startOfWeek.getTime()
    
    // Get the current XP for the week
    const weeklyGoalKey = `xp:goal:${userId}:${weekStartTimestamp}`
    const existingGoalData = await kv.get(weeklyGoalKey)
    
    let currentXP = 0
    let completed = false
    
    if (existingGoalData && typeof existingGoalData === 'object' && 'value' in existingGoalData && existingGoalData.value) {
      const existingGoal = JSON.parse(String(existingGoalData.value))
      currentXP = existingGoal.currentXP || 0
      completed = currentXP >= targetXP
    }
    
    // Create or update the weekly goal
    const newGoal: WeeklyXPGoal = {
      userId,
      weekStartDate: weekStartTimestamp,
      targetXP,
      currentXP,
      completed
    }
    
    // Save the goal
    await kv.set(weeklyGoalKey, JSON.stringify(newGoal))
    
    return NextResponse.json({
      success: true,
      goal: newGoal
    })
  } catch (error) {
    console.error("Erro ao definir meta semanal:", error)
    return NextResponse.json(
      { success: false, error: "Falha ao definir meta semanal" },
      { status: 500 }
    )
  }
} 
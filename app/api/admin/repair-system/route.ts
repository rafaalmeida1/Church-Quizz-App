import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { kv } from '@vercel/kv'
import {
  repairParishQuizzes,
  getParishQuizzes,
  getAllParishes,
  repairQuiz,
  getParish,
  getUser
} from '@/lib/db'
import { Parish } from '@/lib/types'

// Define interface for repair results
interface RepairResults {
  repairedQuizzes: number;
  failedQuizzes: number;
  totalQuizzes: number;
  auditResults: Record<string, {
    userCount: number;
    quizCount: number;
    invalidDataItems: number;
  }>;
  structureRepairs: Record<string, {
    fixedRefs: number;
    errors: number;
  }>;
  targetedParish: string;
}

// System-wide repair endpoint for administrators
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const session = await getSession()
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: "Não autenticado" },
        { status: 401 }
      )
    }
    
    // Only admins can run repairs
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: "Apenas administradores podem reparar o sistema" },
        { status: 403 }
      )
    }

    // Get repair options from request
    const { 
      parishId,
      repairQuizzes = true, 
      repairStructures = true,
      auditData = true 
    } = await request.json()

    const results: RepairResults = {
      repairedQuizzes: 0,
      failedQuizzes: 0,
      totalQuizzes: 0,
      auditResults: {},
      structureRepairs: {},
      targetedParish: parishId || 'all'
    }

    // Get parishes to process
    let parishes = [] as Parish[]
    if (parishId) {
      const parish = await getParish(parishId)
      if (parish) parishes = [parish]
    } else {
      parishes = await getAllParishes()
    }

    if (!parishes.length) {
      return NextResponse.json({
        success: false,
        error: "Nenhuma paróquia encontrada para reparar"
      }, { status: 404 })
    }

    // Process each parish
    for (const parish of parishes) {
      if (!parish || !parish.id) continue

      console.log(`Processing parish: ${parish.id}`)
      
      // 1. Repair quizzes
      if (repairQuizzes) {
        const repairResults = await repairParishQuizzes(parish.id)
        results.repairedQuizzes += repairResults.repaired
        results.failedQuizzes += repairResults.failed
        results.totalQuizzes += repairResults.total
      }

      // 2. Repair data structures
      if (repairStructures) {
        results.structureRepairs[parish.id] = {
          fixedRefs: 0,
          errors: 0
        }
        
        try {
          // Fix parish-quizzes references
          const quizIds = await kv.smembers(`parish:${parish.id}:quizzes`) || []
          let validQuizCount = 0
          
          for (const quizId of quizIds) {
            const quiz = await kv.hgetall(quizId)
            if (!quiz || Object.keys(quiz).length === 0) {
              // Remove invalid reference
              await kv.srem(`parish:${parish.id}:quizzes`, quizId)
              results.structureRepairs[parish.id].fixedRefs++
            } else {
              validQuizCount++
            }
          }
          
          console.log(`Parish ${parish.id}: Valid quizzes: ${validQuizCount}, Removed refs: ${results.structureRepairs[parish.id].fixedRefs}`)
        } catch (error) {
          console.error(`Error repairing structures for parish ${parish.id}:`, error)
          results.structureRepairs[parish.id].errors++
        }
      }
      
      // 3. Audit data
      if (auditData) {
        results.auditResults[parish.id] = {
          userCount: 0,
          quizCount: 0,
          invalidDataItems: 0
        }
        
        try {
          // Check parish users
          const userIds = await kv.smembers(`parish:${parish.id}:users`) || []
          results.auditResults[parish.id].userCount = userIds.length
          
          // Check parish quizzes
          const quizzes = await getParishQuizzes(parish.id)
          results.auditResults[parish.id].quizCount = quizzes.length
          
          // Check for invalid data items
          for (const quiz of quizzes) {
            if (!quiz.questoes || !Array.isArray(quiz.questoes)) {
              results.auditResults[parish.id].invalidDataItems++
            }
          }
        } catch (error) {
          console.error(`Error auditing data for parish ${parish.id}:`, error)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Reparação do sistema concluída",
      results
    })
    
  } catch (error) {
    console.error("Error in system repair:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Erro ao reparar sistema" 
      },
      { status: 500 }
    )
  }
} 
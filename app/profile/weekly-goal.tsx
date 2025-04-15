"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Award, Target, Trophy } from "lucide-react"
import { motion } from "framer-motion"
import type { WeeklyXPGoal } from "@/lib/types"

interface WeeklyGoalResponse {
  success: boolean;
  goal?: WeeklyXPGoal;
  error?: string;
}

export default function WeeklyGoalComponent({ userId }: { userId: string }) {
  const [weeklyGoal, setWeeklyGoal] = useState<WeeklyXPGoal | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [targetXP, setTargetXP] = useState(100)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRefetching, setIsRefetching] = useState(false)
  
  useEffect(() => {
    fetchWeeklyGoal()
  }, [])
  
  async function fetchWeeklyGoal() {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/user/${userId}/weekly-goal`)
      const data: WeeklyGoalResponse = await response.json()
      
      if (data.success && data.goal) {
        setWeeklyGoal(data.goal)
        setTargetXP(data.goal.targetXP)
      }
    } catch (error) {
      console.error("Erro ao buscar meta semanal:", error)
    } finally {
      setIsLoading(false)
    }
  }
  
  async function handleSetGoal() {
    if (!userId || targetXP <= 0) return
    
    try {
      setIsSubmitting(true)
      const response = await fetch('/api/user/weekly-goal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, targetXP }),
      })
      
      const data: WeeklyGoalResponse = await response.json()
      
      if (data.success && data.goal) {
        setWeeklyGoal(data.goal)
        setIsEditing(false)
        
        // Refetch after a short delay to ensure we have the latest data
        setTimeout(() => {
          setIsRefetching(true)
          fetchWeeklyGoal().finally(() => setIsRefetching(false))
        }, 500)
      }
    } catch (error) {
      console.error("Erro ao definir meta semanal:", error)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  function getProgressPercentage() {
    if (!weeklyGoal) return 0
    return Math.min(100, (weeklyGoal.currentXP / weeklyGoal.targetXP) * 100)
  }
  
  function formatDate(timestamp: number) {
    const date = new Date(timestamp)
    return date.toLocaleDateString('pt-BR', { 
      day: 'numeric', 
      month: 'short'
    })
  }
  
  function getNextSunday() {
    const today = new Date()
    const daysUntilSunday = 7 - today.getDay()
    const nextSunday = new Date(today)
    nextSunday.setDate(today.getDate() + daysUntilSunday)
    return nextSunday
  }
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Meta Semanal de XP</CardTitle>
          <CardDescription>Carregando...</CardDescription>
        </CardHeader>
      </Card>
    )
  }
  
  if (isEditing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2 text-primary" />
            Definir Meta Semanal
          </CardTitle>
          <CardDescription>
            Determine quantos pontos de experiência você quer ganhar esta semana
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-3">
            <Label htmlFor="targetXP">Meta de XP</Label>
            <div className="flex space-x-2">
              <Input
                id="targetXP"
                type="number"
                min={50}
                max={500}
                value={targetXP}
                onChange={(e) => setTargetXP(Number(e.target.value))}
              />
              <Button 
                onClick={handleSetGoal} 
                disabled={isSubmitting}
                className="whitespace-nowrap"
              >
                {isSubmitting ? "Salvando..." : "Definir Meta"}
              </Button>
            </div>
            
            <div className="text-sm text-muted-foreground mt-2">
              Sugestões: 
              <div className="flex flex-wrap gap-2 mt-1">
                {[50, 100, 150, 200, 300].map(value => (
                  <Button
                    key={value}
                    variant="outline"
                    size="sm"
                    onClick={() => setTargetXP(value)}
                    className="h-8 px-2 py-0"
                  >
                    {value} XP
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter>
          <Button 
            variant="ghost" 
            onClick={() => setIsEditing(false)}
            className="w-full"
          >
            Cancelar
          </Button>
        </CardFooter>
      </Card>
    )
  }
  
  if (!weeklyGoal) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2 text-primary" />
            Meta Semanal de XP
          </CardTitle>
          <CardDescription>
            Defina uma meta de XP para acompanhar seu progresso na catequese
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Award className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma meta definida</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Defina uma meta semanal de XP para acompanhar seu progresso e manter-se motivado.
            </p>
          </div>
        </CardContent>
        
        <CardFooter>
          <Button 
            onClick={() => setIsEditing(true)}
            className="w-full"
          >
            Definir Meta Semanal
          </Button>
        </CardFooter>
      </Card>
    )
  }
  
  // Mostra a meta atual e o progresso
  const progressPercentage = getProgressPercentage()
  const isCompleted = weeklyGoal.completed || progressPercentage >= 100
  const currentDate = new Date()
  const nextSunday = getNextSunday()
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2 text-primary" />
              Meta Semanal de XP
            </CardTitle>
            <CardDescription>
              {isRefetching ? 'Atualizando...' : (
                `${formatDate(weeklyGoal.weekStartDate)} - ${formatDate(nextSunday.getTime())}`
              )}
            </CardDescription>
          </div>
          
          {isCompleted && (
            <div className="bg-accent/20 p-1.5 rounded-full">
              <Trophy className="h-5 w-5 text-accent" />
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Progresso</span>
              <span className="text-sm font-medium">
                {weeklyGoal.currentXP} / {weeklyGoal.targetXP} XP
              </span>
            </div>
            <div className="relative h-4 overflow-hidden rounded-full bg-muted">
              <motion.div
                className={`absolute left-0 top-0 bottom-0 ${
                  isCompleted ? 'bg-accent' : 'bg-primary'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1, delay: 0.2 }}
              />
            </div>
          </div>
          
          {isCompleted ? (
            <div className="bg-accent/10 border border-accent/20 rounded-lg p-3 text-center mt-2">
              <Trophy className="h-6 w-6 text-accent mx-auto mb-1" />
              <p className="text-sm font-medium">Meta concluída! Parabéns!</p>
              <p className="text-xs text-muted-foreground mt-1">
                Continue acumulando XP para crescer ainda mais!
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Faltam <span className="font-medium">{weeklyGoal.targetXP - weeklyGoal.currentXP} XP</span> para 
              atingir sua meta semanal. Complete quizzes para ganhar XP!
            </p>
          )}
        </div>
      </CardContent>
      
      <CardFooter>
        <Button 
          variant="outline" 
          onClick={() => setIsEditing(true)}
          className="w-full"
        >
          Alterar Meta
        </Button>
      </CardFooter>
    </Card>
  )
} 
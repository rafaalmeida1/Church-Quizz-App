"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { submitQuizResponse } from "@/app/actions"
import { AlertCircle, CheckCircle, X, MessageCircle, Heart, Award, XCircle, Cross, Eye } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { motion, AnimatePresence } from "framer-motion"
import confetti from 'canvas-confetti'
import { cn } from "@/lib/utils"
import { QuizResults } from "./quiz-result"

// Declaração de módulo para o canvas-confetti
declare module 'canvas-confetti';

type Option = {
  id: string;
  text: string;
};

type Question = {
  id: string;
  text: string;
  options: Option[];
  correctOption: number;
};

type Quiz = {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  expiresAt: number | string;
  expired?: boolean;
};

interface QuizClientProps {
  quizId: string;
}

export default function QuizClient({ quizId }: QuizClientProps) {
  const router = useRouter()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const incorrectAudioRef = useRef<HTMLAudioElement | null>(null)
  
  // Estado do quiz
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>({})
  const [answers, setAnswers] = useState<Array<{questionId: string, opcaoSelecionada: number, estaCorreta: boolean}>>([])
  const [score, setScore] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [showFeedback, setShowFeedback] = useState<'correct' | 'incorrect' | null>(null)
  const [streak, setStreak] = useState(0)
  const [lives, setLives] = useState(3)
  const [animation, setAnimation] = useState<'slide-in' | 'slide-out' | null>(null)
  const [xpGained, setXpGained] = useState(0)
  const [showResultsModal, setShowResultsModal] = useState(false)

  // Cores do tema católico
  const colors = {
    primary: "hsl(var(--primary))",       // Azul profundo (Maria)
    secondary: "hsl(var(--secondary))",    // Vermelho (Espírito Santo)
    accent: "hsl(var(--accent))",          // Dourado (Santidade)
    textDark: "hsl(var(--foreground))",    // Texto principal
    textLight: "hsl(var(--muted-foreground))", // Texto secundário
    background: "hsl(var(--background))",  // Fundo
    correct: "hsl(142, 71%, 45%)",         // Verde para acertos
    incorrect: "hsl(0, 84%, 60%)"          // Vermelho para erros
  }

  // Fetch quiz data
  useEffect(() => {
    async function fetchQuiz() {
      setIsLoading(true)
      try {
        console.log("Fetching quiz with ID:", quizId)
        if (!quizId || quizId === 'create') {
          console.error("Invalid quiz ID:", quizId)
          setError("Quiz inválido. Por favor, tente outra página.")
          return
        }

        // Obter o ID do usuário da sessão
        const response = await fetch("/api/session")
        const sessionData = await response.json()
        
        if (!sessionData.success || !sessionData.user?.id) {
          console.log("No user session found, redirecting to login")
          router.push("/login")
          return
        }
        
        setUserId(sessionData.user.id)
        
        // Obter dados do quiz
        console.log("Fetching quiz data from API")
        const quizResponse = await fetch(`/api/quizzes/${quizId}`)
        
        if (!quizResponse.ok) {
          console.error("Quiz API response not OK:", quizResponse.status)
          setError("Não foi possível encontrar este quiz. Ele pode ter sido removido ou expirado.")
          return
        }
        
        const quizData = await quizResponse.json()
        
        if (!quizData.success) {
          console.error("Quiz data fetch error:", quizData.error)
          setError(quizData.error || "Falha ao carregar o quiz")
          return
        }
        
        // Check if quiz is expired
        const expiresAt = new Date(quizData.quiz.expiresAt || quizData.quiz.expiraEm)
        const now = new Date()
        const isExpired = expiresAt < now
        
        // Adapta os dados do quiz recebidos para o formato esperado pelo componente
        const adaptedQuiz = {
          id: quizData.quiz.id,
          title: quizData.quiz.titulo || quizData.quiz.title,
          description: quizData.quiz.descricao || quizData.quiz.description,
          questions: (quizData.quiz.questoes || quizData.quiz.questions || []).map((q: any) => ({
            id: q.id,
            text: q.texto || q.text,
            options: Array.isArray(q.opcoes) 
              ? q.opcoes.map((opt: any, i: number) => typeof opt === 'string' ? { id: i.toString(), text: opt } : opt)
              : (q.options || []),
            correctOption: q.opcaoCorreta !== undefined ? q.opcaoCorreta : q.correctOption
          })),
          expiresAt: quizData.quiz.expiraEm || quizData.quiz.expiresAt,
          expired: isExpired
        }
        
        console.log('Dados do quiz adaptados:', adaptedQuiz)
        setQuiz(adaptedQuiz)
      } catch (error) {
        console.error("Erro ao carregar quiz:", error)
        setError("Ocorreu um erro ao carregar o quiz. Por favor, tente novamente.")
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchQuiz()
  }, [quizId, router])

  // useEffect para carregar sons
  useEffect(() => {
    audioRef.current = new Audio('/sounds/correct.mp3') // Crie estes arquivos de áudio
    incorrectAudioRef.current = new Audio('/sounds/incorrect.mp3')
  }, [])

  // Função para tocar som de acerto
  const playCorrectSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(e => console.error("Erro ao tocar som:", e))
    }
  }

  // Função para tocar som de erro
  const playIncorrectSound = () => {
    if (incorrectAudioRef.current) {
      incorrectAudioRef.current.currentTime = 0
      incorrectAudioRef.current.play().catch(e => console.error("Erro ao tocar som:", e))
    }
  }

  // Função para disparar confetti
  const triggerConfetti = () => {
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FFC800', '#58CC02', '#1CB0F6', '#CE82FF', '#FF4B4B']
    })
  }

  // Função para disparar confetti temático católico
  const triggerCatholicConfetti = () => {
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
      colors: [
        colors.primary,
        colors.secondary, 
        colors.accent,
      ]
    })
  }

  function handleOptionSelect(questionId: string, optionIndex: number) {
    setSelectedOptions({
      ...selectedOptions,
      [questionId]: optionIndex,
    })
  }

  async function checkAnswer() {
    if (!quiz) return
    
    const currentQuestion = quiz.questions[currentQuestionIndex]
    const selectedOption = selectedOptions[currentQuestion.id]
    
    if (selectedOption === undefined) return
    
    const isCorrect = selectedOption === currentQuestion.correctOption
    
    // Atualiza a pontuação e registra a resposta
    const newAnswers = [
      ...answers,
      {
        questionId: currentQuestion.id,
        opcaoSelecionada: selectedOption,
        estaCorreta: isCorrect
      }
    ]
    
    setAnswers(newAnswers)
    
    // Mostra feedback e toca sons
    setShowFeedback(isCorrect ? 'correct' : 'incorrect')
    
    if (isCorrect) {
      playCorrectSound()
      setStreak(prev => prev + 1)
      
      // A cada 3 acertos seguidos, dispara confetti
      if ((streak + 1) % 3 === 0) {
        triggerCatholicConfetti()
      }
    } else {
      playIncorrectSound()
      setStreak(0)
      setLives(prev => Math.max(0, prev - 1))
    }
    
    // Aguarda 1.5 segundos para mostrar o feedback antes de passar para a próxima pergunta
    setTimeout(() => {
      setShowFeedback(null)
      
      if (currentQuestionIndex < quiz.questions.length - 1 && lives > 0) {
        // Prepara animação de transição
        setAnimation('slide-out')
        
        setTimeout(() => {
          setCurrentQuestionIndex(prev => prev + 1)
          // Limpa a opção selecionada para a próxima pergunta
          setSelectedOptions(prev => {
            const newOptions = {...prev}
            delete newOptions[currentQuestion.id]
            return newOptions
          })
          setAnimation('slide-in')
          
          setTimeout(() => {
            setAnimation(null)
          }, 500)
        }, 300)
      } else {
        // Finaliza o quiz se acabaram as perguntas ou as vidas
        finishQuiz(newAnswers)
      }
    }, 1500)
  }

  async function finishQuiz(finalAnswers = answers) {
    if (!quiz || !userId) return
    
    setIsSubmitting(true)
    
    try {
      // Calcula pontuação
      const correctAnswers = finalAnswers.filter(a => a.estaCorreta).length
      const totalQuestions = quiz.questions.length
      // Ensure score is always based on the correct percentage calculation
      const calculatedScore = (correctAnswers / totalQuestions) * 100
      
      // Verifica se o quiz expirou (afeta a pontuação)
      const expiresAt = new Date(quiz.expiresAt)
      const now = new Date()
      const isExpired = expiresAt < now
      
      // Reduz a pontuação se o quiz estiver expirado
      const finalScore = isExpired ? Math.round(calculatedScore * 0.7) : Math.round(calculatedScore)
      
      // Calcula XP ganho
      // Base XP: 10 por quiz completo, 5 por resposta correta, bônus de streak
      const baseXP = 10
      const correctAnswerXP = 5 * correctAnswers
      const streakBonus = streak >= 3 ? 10 : 0
      const totalXP = isExpired ? Math.round((baseXP + correctAnswerXP + streakBonus) * 0.7) : (baseXP + correctAnswerXP + streakBonus)
      
      setXpGained(totalXP)
      setScore(finalScore)
      setShowResult(true)
      
      // Se acertou mais de 70%, dispara confetti temático católico
      if (finalScore >= 70) {
        setTimeout(() => {
          triggerCatholicConfetti()
        }, 500)
      }
      
      // Enviar as respostas para a API
      const result = await submitQuizResponse({
        quizId: quiz.id,
        userId,
        answers: finalAnswers,
        score: finalScore,
        xp: totalXP
      })
      
      if (!result.success) {
        console.error("Erro ao salvar respostas:", result.error)
      }
    } catch (error) {
      console.error("Erro ao finalizar quiz:", error)
      setError("Ocorreu um erro ao salvar suas respostas.")
    } finally {
      setIsSubmitting(false)
    }
  }

  function navigateBack() {
    router.push('/quizzes')
  }

  // Prepara os dados para o modal de resultados detalhados
  const prepareResultsData = () => {
    if (!quiz) return { resultQuestions: [], userAnswersForModal: {} };
    
    const resultQuestions = quiz.questions.map(q => ({
      id: q.id,
      question: q.text,
      options: q.options.map(o => o.text),
      answer: q.options[q.correctOption].text
    }));
    
    const userAnswersForModal = answers.reduce((acc, answer) => {
      const question = quiz.questions.find(q => q.id === answer.questionId);
      if (question) {
        acc[answer.questionId] = question.options[answer.opcaoSelecionada].text;
      }
      return acc;
    }, {} as Record<string, string>);
    
    return { resultQuestions, userAnswersForModal };
  };

  // Renderização do componente
  if (isLoading) {
    return (
      <div className="container max-w-2xl mx-auto p-4 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-full">
          <Card className="card-vitral">
            <CardHeader className="text-center">
              <CardTitle>Carregando Quiz</CardTitle>
              <CardDescription>
                Aguarde enquanto carregamos o quiz...
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="animate-pulse my-8">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="64" 
                  height="64" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="text-primary"
                >
                  <path d="M12 2L14.85 8.3L22 9.3L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.3L9.15 8.3L12 2Z"></path>
                </svg>
              </div>
              <Progress value={40} className="w-full mt-4" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container max-w-2xl mx-auto p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={navigateBack} className="mt-4 w-full">Voltar para Quizzes</Button>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="container max-w-2xl mx-auto p-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Quiz não encontrado</AlertTitle>
          <AlertDescription>Não foi possível encontrar o quiz solicitado.</AlertDescription>
        </Alert>
        <Button onClick={navigateBack} className="mt-4 w-full">Voltar para Quizzes</Button>
      </div>
    )
  }

  // Mostra resultados finais
  if (showResult) {
    const correctAnswers = answers.filter(a => a.estaCorreta).length;
    const totalQuestions = quiz.questions.length;
    const percentage = score !== null ? score : Math.round((correctAnswers / totalQuestions) * 100);
    
    let resultMessage = "";
    let resultIcon = null;
    
    if (percentage >= 90) {
      resultMessage = "Excelente! Seu conhecimento é inspirador!";
      resultIcon = <Award className="h-12 w-12 text-[hsl(var(--accent))]" />;
    } else if (percentage >= 70) {
      resultMessage = "Muito bom! Continue estudando e crescendo na fé!";
      resultIcon = <CheckCircle className="h-12 w-12 text-primary" />;
    } else if (percentage >= 50) {
      resultMessage = "Bom resultado! Há espaço para crescimento.";
      resultIcon = <MessageCircle className="h-12 w-12 text-primary" />;
    } else {
      resultMessage = "Continue estudando! A jornada de fé é contínua.";
      resultIcon = <Heart className="h-12 w-12 text-secondary" />;
    }
    
    const { resultQuestions, userAnswersForModal } = prepareResultsData();
    
    return (
      <div className="container max-w-2xl mx-auto p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="card-vitral overflow-hidden">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl md:text-3xl font-cinzel">{quiz.title}</CardTitle>
              {quiz.expired && (
                <div className="inline-flex items-center rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1 text-xs text-destructive mt-2">
                  <XCircle className="mr-1 h-3 w-3" /> Quiz expirado - pontuação reduzida
                </div>
              )}
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center justify-center space-y-4 pt-4">
                {resultIcon}
                
                <div className="relative">
                  <div className="text-center">
                    <div className="text-5xl font-bold holy-glow">{percentage}%</div>
                    <div className="text-lg font-medium mt-2">{correctAnswers} de {totalQuestions} questões corretas</div>
                    {xpGained > 0 && (
                      <div className="mt-2 text-sm font-medium bg-accent/20 text-accent-foreground py-1 px-3 rounded-full inline-flex items-center">
                        <Award className="h-4 w-4 mr-1" /> +{xpGained} XP ganho
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-center font-medium text-lg mt-4">
                  {resultMessage}
                </div>
              </div>
              
              <div className="space-y-4 pt-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold mb-2 font-cinzel">Resultado resumido:</h3>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowResultsModal(true)}
                    className="flex items-center gap-1"
                  >
                    <Eye className="h-4 w-4" />
                    <span>Ver detalhes</span>
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {quiz.questions.map((question, index) => {
                    const answer = answers.find(a => a.questionId === question.id);
                    const isCorrect = answer?.estaCorreta;
                    
                    return (
                      <div 
                        key={question.id}
                        className={cn(
                          "p-3 rounded-lg border flex items-center",
                          isCorrect 
                            ? "border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-900" 
                            : "border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-900"
                        )}
                      >
                        <div className="mr-3">
                          {isCorrect ? (
                            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                          ) : (
                            <X className="h-5 w-5 text-red-600 dark:text-red-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            Questão {index + 1}: {question.text}
                          </p>
                          {!isCorrect && (
                            <p className="text-xs mt-1">
                              <span className="font-medium">Resposta correta:</span> {question.options[question.correctOption].text}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
            
            <CardFooter>
              <Button
                onClick={navigateBack} 
                className="w-full btn-catholic"
              >
                Voltar para Quizzes
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
        
        {/* Modal detalhado de resultados */}
        {quiz && (
          <QuizResults 
            questions={resultQuestions}
            userAnswers={userAnswersForModal}
            score={percentage}
            isOpen={showResultsModal}
            onClose={() => setShowResultsModal(false)}
          />
        )}
      </div>
    );
  }

  // Mostra o quiz
  const currentQuestion = quiz.questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex) / quiz.questions.length) * 100

  return (
    <div className="container max-w-2xl mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={navigateBack}
            className="mr-2"
          >
            <X className="h-5 w-5" />
          </Button>
          <Progress value={progress} className="w-24 md:w-40" />
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Sequência de acertos */}
          {streak > 0 && (
            <div className="flex items-center bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] px-2 py-1 rounded-full text-sm font-medium">
              <Award className="h-4 w-4 mr-1" />
              {streak}
            </div>
          )}
          
          {/* Vidas restantes */}
          <div className="flex">
            {[...Array(lives)].map((_, i) => (
              <Heart key={i} className="h-5 w-5 text-secondary" fill="hsl(var(--secondary))" />
            ))}
            {[...Array(3 - lives)].map((_, i) => (
              <Heart key={`empty-${i}`} className="h-5 w-5 text-muted-foreground" />
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={animation === 'slide-in' ? { x: 300, opacity: 0 } : { opacity: 1 }}
          animate={{ x: 0, opacity: 1 }}
          exit={animation === 'slide-out' ? { x: -300, opacity: 0 } : { opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <Card className="card-vitral overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl font-cinzel">
                {currentQuestion.text}
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              <RadioGroup
                value={selectedOptions[currentQuestion.id]?.toString()}
                className="space-y-3"
                onValueChange={(value) => handleOptionSelect(currentQuestion.id, parseInt(value))}
              >
                {currentQuestion.options.map((option, index) => {
                  // Determina se esta opção está selecionada e se o feedback está sendo mostrado
                  const isSelected = selectedOptions[currentQuestion.id] === index
                  const isCorrect = showFeedback && index === currentQuestion.correctOption
                  const isWrong = showFeedback && isSelected && !isCorrect
                  
                  let optionClass = "radio-group-item border-2 transition-all duration-300"
                  
                  if (showFeedback === null) {
                    // Estado normal
                    optionClass += isSelected ? " border-primary bg-primary/5" : " hover:border-primary/50"
                  } else if (isCorrect) {
                    // Opção correta (quando mostrando feedback)
                    optionClass += " border-green-500 bg-green-50 dark:bg-green-900/20"
                  } else if (isWrong) {
                    // Opção errada selecionada (quando mostrando feedback)
                    optionClass += " border-red-500 bg-red-50 dark:bg-red-900/20"
                  } else {
                    // Outras opções durante o feedback
                    optionClass += " opacity-60"
                  }
                  
                  return (
                    <div 
                      key={index} 
                      className={optionClass}
                      onClick={() => {
                        if (showFeedback === null) {
                          handleOptionSelect(currentQuestion.id, index)
                        }
                      }}
                    >
                      <div className="flex items-center justify-between p-2">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem 
                            value={index.toString()} 
                            id={`option-${currentQuestion.id}-${index}`} 
                            disabled={showFeedback !== null}
                          />
                          <Label 
                            htmlFor={`option-${currentQuestion.id}-${index}`}
                            className="flex-1 cursor-pointer"
                          >
                            {option.text}
                          </Label>
                        </div>
                        
                        {showFeedback && (
                          <>
                            {isCorrect && (
                              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                            )}
                            {isWrong && (
                              <X className="h-5 w-5 text-red-600 dark:text-red-400" />
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </RadioGroup>
            </CardContent>
            
            <CardFooter>
              <Button
                onClick={checkAnswer}
                disabled={selectedOptions[currentQuestion.id] === undefined || showFeedback !== null}
                className="w-full h-12 text-lg font-medium btn-catholic"
              >
                {showFeedback === 'correct' ? (
                  <span className="flex items-center">
                    <CheckCircle className="mr-2 h-5 w-5" /> Correto!
                  </span>
                ) : showFeedback === 'incorrect' ? (
                  <span className="flex items-center">
                    <X className="mr-2 h-5 w-5" /> Incorreto
                  </span>
                ) : (
                  "Verificar"
                )}
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </AnimatePresence>
      
      {/* Elementos de áudio invisíveis */}
      <div className="hidden">
        <audio ref={audioRef} />
        <audio ref={incorrectAudioRef} />
      </div>
    </div>
  )
} 
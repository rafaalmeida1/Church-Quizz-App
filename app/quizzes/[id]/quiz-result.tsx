import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

interface Question {
  id: string;
  question: string;
  options: string[];
  answer: string;
}

interface QuizResultsProps {
  questions: Question[];
  userAnswers: Record<string, string>;
  score: number;
  isOpen: boolean;
  onClose: () => void;
}

export function QuizResults({ questions, userAnswers, score, isOpen, onClose }: QuizResultsProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-background rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto p-4"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Resultados do Quiz</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-muted transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="text-center mb-6">
          <p className="text-2xl font-bold">{Math.round(score)}%</p>
          <p className="text-muted-foreground">Pontuação Final</p>
        </div>
        
        <div className="space-y-4">
          {questions.map((question, index) => {
            const userAnswer = userAnswers[question.id];
            const isCorrect = userAnswer === question.answer;
            
            return (
              <div 
                key={question.id} 
                className={`p-4 rounded-lg border ${
                  isCorrect ? 'border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900' : 
                  'border-destructive/20 bg-destructive/10'
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className={`mt-1 flex-shrink-0 rounded-full p-1.5 ${
                    isCorrect ? 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400' : 
                    'bg-destructive/20 text-destructive'
                  }`}>
                    {isCorrect ? <Check size={16} /> : <X size={16} />}
                  </div>
                  <div>
                    <p className="font-medium">Questão {index + 1}</p>
                    <p className="text-sm mb-2">{question.question}</p>
                    
                    <div className="space-y-1">
                      {question.options.map((option) => (
                        <div key={option} className={`text-sm p-2 rounded ${
                          option === question.answer ? 'bg-green-100 dark:bg-green-900/40 font-medium' : 
                          option === userAnswer && option !== question.answer ? 'bg-destructive/20 font-medium' : 
                          'bg-muted/50'
                        }`}>
                          {option}
                          {option === question.answer && (
                            <span className="ml-2 text-green-600 dark:text-green-400 text-xs">(Correta)</span>
                          )}
                          {option === userAnswer && option !== question.answer && (
                            <span className="ml-2 text-destructive text-xs">(Sua resposta)</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-6 flex justify-center">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Fechar
          </button>
        </div>
      </motion.div>
    </div>
  );
} 
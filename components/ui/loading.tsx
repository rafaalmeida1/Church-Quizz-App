"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

export function PageLoadingBar() {
  return (
    <div className="page-loading-bar" />
  )
}

export function Spinner({ size = "default" }: { size?: "small" | "default" | "large" }) {
  return (
    <div 
      className={`loader-catholic ${
        size === "small" ? "w-6 h-6 border-2" : 
        size === "large" ? "w-12 h-12 border-4" : 
        "w-8 h-8 border-3"
      }`} 
    />
  )
}

export function LoadingDots() {
  return (
    <div className="flex space-x-1 items-center justify-center">
      <motion.div
        className="w-2 h-2 bg-primary rounded-full"
        animate={{ scale: [0.5, 1, 0.5] }}
        transition={{ duration: 1, repeat: Infinity, delay: 0 }}
      />
      <motion.div
        className="w-2 h-2 bg-accent rounded-full"
        animate={{ scale: [0.5, 1, 0.5] }}
        transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
      />
      <motion.div
        className="w-2 h-2 bg-secondary rounded-full"
        animate={{ scale: [0.5, 1, 0.5] }}
        transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
      />
    </div>
  )
}

export function CatholicLoading({ message = "Carregando..." }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="relative">
        <Spinner size="large" />
        <motion.div 
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
            <path d="M12 2L14.85 8.3L22 9.3L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.3L9.15 8.3L12 2Z" 
                  fill="hsl(var(--accent))" 
                  stroke="hsl(var(--accent-foreground))" 
                  strokeWidth="0.5"/>
          </svg>
        </motion.div>
      </div>
      <p className="text-muted-foreground font-medium">{message}</p>
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="shimmer rounded-xl overflow-hidden">
      <div className="h-40 bg-muted" />
      <div className="p-4 space-y-3">
        <div className="h-6 bg-muted rounded-md w-3/4" />
        <div className="h-4 bg-muted rounded-md w-1/2" />
        <div className="h-4 bg-muted rounded-md w-5/6" />
      </div>
    </div>
  )
}

export function ButtonLoading({ children, isLoading, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { isLoading: boolean }) {
  return (
    <button 
      disabled={isLoading} 
      className="relative inline-flex items-center justify-center rounded-full py-2 px-4 font-medium bg-primary text-primary-foreground transition-all hover:opacity-90 disabled:opacity-70" 
      {...props}
    >
      {isLoading ? (
        <>
          <span className="opacity-0">{children}</span>
          <span className="absolute inset-0 flex items-center justify-center">
            <Spinner size="small" />
          </span>
        </>
      ) : children}
    </button>
  )
}

export function Toast({ 
  message, 
  type = "info",
  duration = 3000
}: { 
  message: string; 
  type?: "success" | "error" | "info"; 
  duration?: number;
}) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`toast-message toast-${type}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative mb-8"
      >
        <svg viewBox="0 0 24 24" fill="none" className="w-20 h-20">
          <path d="M12 2L14.85 8.3L22 9.3L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.3L9.15 8.3L12 2Z" 
                fill="hsl(var(--accent))" 
                stroke="hsl(var(--accent-foreground))" 
                strokeWidth="0.5"/>
        </svg>
        <motion.div 
          className="absolute inset-0"
          animate={{ 
            boxShadow: ['0 0 0 0 rgba(var(--accent), 0)', '0 0 20px 10px rgba(var(--accent), 0.3)', '0 0 0 0 rgba(var(--accent), 0)'] 
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.div>
      
      <motion.h1 
        className="text-2xl font-cinzel font-bold text-primary mb-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        Catequese App
      </motion.h1>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <LoadingDots />
      </motion.div>
    </div>
  );
} 

export function StatsCardSkeleton() {
  return (
    <div className="shimmer rounded-xl overflow-hidden">
      <div className="h-40 bg-muted" />
      <div className="p-4 space-y-3">
        <div className="h-6 bg-muted rounded-md w-3/4" />
        <div className="h-4 bg-muted rounded-md w-1/2" />
        <div className="h-4 bg-muted rounded-md w-5/6" />
      </div>
    </div>
  )
}

"use client"

import { ButtonHTMLAttributes, forwardRef } from "react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/loading"
import { cn } from "@/lib/utils"

export interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean
  loadingText?: string
  className?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ children, isLoading, loadingText, className, disabled, ...props }, ref) => {
    return (
      <Button
        className={cn("flex items-center gap-2", className)}
        disabled={isLoading || disabled}
        ref={ref}
        {...props}
      >
        {isLoading ? (
          <>
            <Spinner size="small" />
            <span>{loadingText || "Carregando..."}</span>
          </>
        ) : (
          children
        )}
      </Button>
    )
  }
)

LoadingButton.displayName = "LoadingButton"

export { LoadingButton } 
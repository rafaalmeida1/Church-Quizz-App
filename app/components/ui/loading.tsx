import { Card, CardContent } from "@/components/ui/card"

export function LoadingDots() {
  return (
    <div className="flex space-x-1 justify-center items-center">
      <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="h-2 w-2 bg-primary rounded-full animate-bounce"></div>
    </div>
  )
}

export function StatsCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className="bg-muted h-12 w-12 rounded-full"></div>
          <div>
            <div className="h-4 w-20 bg-muted rounded-md mb-2"></div>
            <div className="h-7 w-16 bg-muted rounded-md mb-2"></div>
            <div className="h-3 w-24 bg-muted rounded-md"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 
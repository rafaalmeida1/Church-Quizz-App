import { kv } from "@vercel/kv"

// Log and track errors
export async function logError(
  error: unknown, 
  context: {
    component?: string;
    method?: string;
    userId?: string;
    parishId?: string;
    quizId?: string;
    path?: string;
    additionalInfo?: Record<string, any>;
  }
): Promise<string> {
  try {
    const errorId = `error:${Date.now()}:${Math.random().toString(36).substring(2, 9)}`;
    
    // Format error object
    let errorObj: Record<string, any> = {
      id: errorId,
      timestamp: new Date().toISOString(),
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      ...context
    };
    
    // Track error in KV store for later analysis
    await kv.set(errorId, JSON.stringify(errorObj));
    await kv.lpush('system:errors', errorId);
    
    // Keep error log at reasonable size
    await kv.ltrim('system:errors', 0, 999);
    
    // Log to console for immediate visibility
    console.error(
      `[ERROR] ${context.component || 'Unknown'} - ${context.method || 'Unknown'}: `,
      error instanceof Error ? error.message : error,
      context
    );
    
    return errorId;
  } catch (loggingError) {
    // Fallback if error logging itself fails
    console.error('Error during error logging:', loggingError);
    console.error('Original error:', error);
    console.error('Context:', context);
    return 'logging-failed';
  }
}

// Provide standardized API error responses
export function createErrorResponse(
  error: unknown, 
  status = 500,
  context?: Record<string, any>
) {
  // Get appropriate message and status
  let message = 'Ocorreu um erro inesperado';
  let errorId;
  
  if (error instanceof Error) {
    message = error.message;
    // Log error with context
    errorId = logError(error, context || {});
  } else {
    // Log unknown error type
    errorId = logError(error, context || {});
  }
  
  // Return consistent error format
  return {
    success: false,
    error: message,
    errorId,
    ...(context ? { context } : {})
  };
}

// Monitor and analyze system health
export async function getErrorStats(timeRangeHours = 24): Promise<Record<string, any>> {
  try {
    // Get recent errors
    const errorIds = await kv.lrange('system:errors', 0, 99);
    
    if (!errorIds || errorIds.length === 0) {
      return {
        count: 0, 
        byComponent: {},
        byMethod: {},
        recentErrors: []
      };
    }
    
    const now = Date.now();
    const timeThreshold = now - (timeRangeHours * 60 * 60 * 1000);
    
    // Retrieve error data
    const errorPromises = errorIds.map(id => kv.get(id));
    const errorData = await Promise.all(errorPromises);
    
    // Parse and filter errors
    const parsedErrors = errorData
      .filter(Boolean)
      .map(data => {
        try {
          return typeof data === 'string' ? JSON.parse(data) : data;
        } catch {
          return null;
        }
      })
      .filter(Boolean);
    
    // Filter by time range
    const recentErrors = parsedErrors.filter(err => {
      const timestamp = new Date(err.timestamp).getTime();
      return timestamp > timeThreshold;
    });
    
    // Analyze errors
    const byComponent: Record<string, number> = {};
    const byMethod: Record<string, number> = {};
    
    recentErrors.forEach(err => {
      const component = err.component || 'unknown';
      const method = err.method || 'unknown';
      
      byComponent[component] = (byComponent[component] || 0) + 1;
      byMethod[method] = (byMethod[method] || 0) + 1;
    });
    
    return {
      count: recentErrors.length,
      byComponent,
      byMethod,
      recentErrors: recentErrors.slice(0, 10) // Only return most recent 10 for UI
    };
  } catch (error) {
    console.error('Error getting error stats:', error);
    return { error: 'Failed to retrieve error statistics' };
  }
} 
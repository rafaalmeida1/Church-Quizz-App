// This file helps with route precedence in Next.js
// It ensures that static routes like /quizzes/create take precedence over dynamic routes like /quizzes/[id]

import { NextResponse } from "next/server"

// This route handler only exists to influence route precedence
// It will never actually be called for /quizzes/create since that has its own page.tsx
export async function GET() {
  return NextResponse.json({ success: false, error: "Route not implemented" }, { status: 404 })
}

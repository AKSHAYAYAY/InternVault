import { NextResponse } from "next/server"

export function apiSuccess<T>(data: T, message?: string, status = 200) {
  return NextResponse.json({ success: true, data, message: message ?? null }, { status })
}

export function apiError(message: string, code: string, status: number) {
  return NextResponse.json({ success: false, error: message, code }, { status })
}

// Common error shortcuts
export const unauthorized = () => apiError("Authentication required", "UNAUTHORIZED", 401)
export const forbidden = () => apiError("You do not have permission to perform this action", "FORBIDDEN", 403)
export const notFound = (resource = "Resource") => apiError(`${resource} not found`, "NOT_FOUND", 404)
export const badRequest = (message: string) => apiError(message, "BAD_REQUEST", 400)
export const conflict = (message: string) => apiError(message, "CONFLICT", 409)
export const serverError = (err: unknown) => {
  const message = err instanceof Error ? err.message : "Internal server error"
  return apiError(message, "INTERNAL_ERROR", 500)
}

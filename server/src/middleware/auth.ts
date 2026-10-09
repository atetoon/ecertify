import type { NextFunction, Request, Response } from "express"

import { verifyToken } from "../auth.js"

export interface AuthenticatedRequest extends Request {
  organizerId?: string
}

export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  const authorization = req.headers.authorization

  if (!authorization?.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    })
    return
  }

  const token = authorization.slice(7)

  try {
    const payload = verifyToken(token)

    req.organizerId = payload.organizerId

    next()
  } catch {
    res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    })
  }
}
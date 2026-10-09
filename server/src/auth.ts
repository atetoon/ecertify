import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET

  if (!secret) {
    throw new Error("JWT_SECRET is not set")
  }

  return secret
}

const SALT_ROUNDS = 12

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function comparePassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash)
}

export function createToken(organizerId: string): string {
  const secret = getJwtSecret()

  return jwt.sign(
    {
      organizerId,
    },
    secret,
    {
      expiresIn: "7d",
    },
  )
}

export function verifyToken(token: string): { organizerId: string } {
  const secret = getJwtSecret()
  const decoded = jwt.verify(token, secret)

  if (
    typeof decoded === "object" &&
    decoded !== null &&
    "organizerId" in decoded &&
    typeof decoded.organizerId === "string"
  ) {
    return {
      organizerId: decoded.organizerId,
    }
  }

  throw new Error("Invalid token payload")
}
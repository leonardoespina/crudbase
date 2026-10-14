import jwt from 'jsonwebtoken'
import { UnauthorizedError } from '../domain/errors'

export interface TokenPayload {
  userId: number
  sessionId: string
  roleId: number
  branchId?: number | null
}

const getSecret = () => {
  const secret = process.env.JWT_SECRET || useRuntimeConfig().jwtSecret
  if (!secret) {
    throw new Error('JWT_SECRET no está configurado en las variables de entorno')
  }
  return secret
}

export function signToken(payload: TokenPayload, expiresIn: string | number = '12h'): string {
  return jwt.sign(payload, getSecret(), { expiresIn })
}

export function verifyToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, getSecret()) as TokenPayload
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new UnauthorizedError('El token de autenticación ha expirado')
    }
    throw new UnauthorizedError('Token de autenticación inválido')
  }
}

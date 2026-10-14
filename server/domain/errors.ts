// Jerarquía de errores de dominio tipados para la Arquitectura Hexagonal

export abstract class DomainError extends Error {
  abstract readonly statusCode: number
  abstract readonly code: string

  constructor(message: string) {
    super(message)
    this.name = this.constructor.name
  }
}

export class ValidationError extends DomainError {
  readonly statusCode = 400
  readonly code = 'VALIDATION_ERROR'
}

export class UnauthorizedError extends DomainError {
  readonly statusCode = 401
  readonly code = 'UNAUTHORIZED'
}

export class SessionTerminatedError extends DomainError {
  readonly statusCode = 401
  readonly code = 'SESSION_TERMINATED'

  constructor(message = 'Tu sesión ha expirado o se inició sesión en otro dispositivo') {
    super(message)
  }
}

export class ForbiddenError extends DomainError {
  readonly statusCode = 403
  readonly code = 'FORBIDDEN'
}

export class NotFoundError extends DomainError {
  readonly statusCode = 404
  readonly code = 'NOT_FOUND'

  constructor(entity: string, identifier?: string | number) {
    super(`${entity}${identifier ? ` con identificador ${identifier}` : ''} no fue encontrado(a)`)
  }
}

export class ConflictError extends DomainError {
  readonly statusCode = 409
  readonly code = 'CONFLICT'
}

export class BusinessRuleError extends DomainError {
  readonly statusCode = 422
  readonly code = 'BUSINESS_RULE_VIOLATION'
}

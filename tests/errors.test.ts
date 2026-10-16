import { describe, it, expect } from 'vitest'
import {
  DomainError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  BusinessRuleError
} from '../server/domain/errors'

describe('Jerarquía de Errores de Dominio (errors.ts)', () => {
  it('todos los errores deben heredar de DomainError y Error', () => {
    const err = new ValidationError('Dato inválido')
    expect(err).toBeInstanceOf(DomainError)
    expect(err).toBeInstanceOf(Error)
    expect(err.statusCode).toBe(400)
    expect(err.code).toBe('VALIDATION_ERROR')
  })

  it('NotFoundError debe formatear el mensaje con entidad e identificador', () => {
    const errWithId = new NotFoundError('Usuario', 42)
    expect(errWithId.message).toBe('Usuario con identificador 42 no fue encontrado(a)')
    expect(errWithId.statusCode).toBe(404)

    const errNoId = new NotFoundError('Sede')
    expect(errNoId.message).toBe('Sede no fue encontrado(a)')
  })

  it('ForbiddenError y UnauthorizedError deben tener los códigos HTTP correctos', () => {
    const unauth = new UnauthorizedError('No autorizado')
    expect(unauth.statusCode).toBe(401)
    expect(unauth.code).toBe('UNAUTHORIZED')

    const forbidden = new ForbiddenError('Acceso denegado')
    expect(forbidden.statusCode).toBe(403)
    expect(forbidden.code).toBe('FORBIDDEN')
  })

  it('ConflictError y BusinessRuleError deben tener los códigos adecuados', () => {
    const conflict = new ConflictError('Email ya registrado')
    expect(conflict.statusCode).toBe(409)

    const rule = new BusinessRuleError('No se puede eliminar un rol del sistema')
    expect(rule.statusCode).toBe(422)
  })
})

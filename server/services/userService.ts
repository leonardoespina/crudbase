import bcrypt from 'bcryptjs'
import { UserRepository } from '../repository/userRepository'
import { AuditRepository } from '../repository/auditRepository'
import { ConflictError, NotFoundError, ValidationError } from '../domain/errors'
import type { UserContext } from '../utils/auth'

export interface CreateUserDTO {
  username: string
  name: string
  email?: string
  password: string
  roleId: number
  branchId?: number | null
  active?: boolean
}

export interface UpdateUserDTO {
  name?: string
  email?: string
  password?: string
  roleId?: number
  branchId?: number | null
  active?: boolean
}

export class UserService {
  static async list(actor: UserContext) {
    // Si no es admin, solo ve los usuarios de su propia sede
    const branchFilter = actor.isAdmin ? null : actor.branchId
    return UserRepository.findAll(branchFilter)
  }

  static async getById(id: number, actor: UserContext) {
    const user = await UserRepository.findById(id)
    if (!user) {
      throw new NotFoundError('Usuario', id)
    }

    if (!actor.isAdmin && user.branchId !== actor.branchId) {
      throw new NotFoundError('Usuario', id)
    }

    return user
  }

  static async create(data: CreateUserDTO, actor: UserContext, ip?: string) {
    if (!data.username || !data.password || !data.name || !data.roleId) {
      throw new ValidationError('Nombre, usuario, contraseña y rol son obligatorios')
    }

    const existing = await UserRepository.findByUsernameWithPassword(data.username)
    if (existing) {
      throw new ConflictError(`El nombre de usuario '${data.username}' ya está registrado`)
    }

    // Forzar la sede del operador si no es admin
    const branchId = actor.isAdmin ? data.branchId : actor.branchId

    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(data.password, salt)

    const user = await UserRepository.create({
      username: data.username.toLowerCase().trim(),
      name: data.name.trim(),
      email: data.email?.trim() || null,
      passwordHash,
      roleId: data.roleId,
      branchId: branchId || null,
      active: data.active ?? true
    })

    await AuditRepository.create({
      userId: actor.id,
      action: 'CREATE',
      entity: 'User',
      entityId: user.id,
      details: JSON.stringify({ username: user.username, roleId: user.roleId }),
      ip
    })

    return user
  }

  static async update(id: number, data: UpdateUserDTO, actor: UserContext, ip?: string) {
    const existing = await UserRepository.findById(id)
    if (!existing) {
      throw new NotFoundError('Usuario', id)
    }

    if (!actor.isAdmin && existing.branchId !== actor.branchId) {
      throw new NotFoundError('Usuario', id)
    }

    const updatePayload: any = {
      name: data.name?.trim(),
      email: data.email?.trim() || null,
      roleId: data.roleId,
      active: data.active
    }

    if (actor.isAdmin) {
      updatePayload.branchId = data.branchId
    }

    if (data.password && data.password.length >= 6) {
      const salt = await bcrypt.genSalt(10)
      updatePayload.passwordHash = await bcrypt.hash(data.password, salt)
    }

    const updated = await UserRepository.update(id, updatePayload)

    await AuditRepository.create({
      userId: actor.id,
      action: 'UPDATE',
      entity: 'User',
      entityId: id,
      details: JSON.stringify({ username: updated.username }),
      ip
    })

    return updated
  }

  static async delete(id: number, actor: UserContext, ip?: string) {
    const existing = await UserRepository.findById(id)
    if (!existing) {
      throw new NotFoundError('Usuario', id)
    }

    if (existing.id === actor.id) {
      throw new ValidationError('No puedes eliminar tu propia cuenta de usuario')
    }

    await UserRepository.delete(id)

    await AuditRepository.create({
      userId: actor.id,
      action: 'DELETE',
      entity: 'User',
      entityId: id,
      details: JSON.stringify({ username: existing.username }),
      ip
    })

    return { success: true }
  }
}

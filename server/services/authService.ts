import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { UserRepository } from '../repository/userRepository'
import { AuditRepository } from '../repository/auditRepository'
import { UnauthorizedError, ValidationError } from '../domain/errors'
import { signToken } from '../utils/jwt'
import { eventBus } from '../utils/eventBus'

export class AuthService {
  static async login(username: string, password: string, ip?: string) {
    if (!username || !password) {
      throw new ValidationError('Usuario y contraseña son requeridos')
    }

    const user = await UserRepository.findByUsernameWithPassword(username)
    if (!user || !user.active) {
      throw new UnauthorizedError('Credenciales incorrectas o usuario inactivo')
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash)
    if (!isMatch) {
      throw new UnauthorizedError('Credenciales incorrectas')
    }

    // Generar nuevo ID de sesión único
    const sessionId = crypto.randomUUID()

    // Si ya tenía una sesión activa previa, notificar revocación a terminal anterior
    if (user.activeSessionId) {
      eventBus.emit('session:revoked', { userId: user.id, newSessionId: sessionId })
    }

    // Actualizar sesión activa en BD
    await UserRepository.update(user.id, {
      activeSessionId: sessionId
    })

    // Registrar en auditoría
    await AuditRepository.create({
      userId: user.id,
      action: 'LOGIN',
      entity: 'User',
      entityId: user.id,
      details: JSON.stringify({ username: user.username, role: user.role?.name }),
      ip
    })

    // Firmar Token JWT
    const token = signToken({
      userId: user.id,
      sessionId,
      roleId: user.roleId,
      branchId: user.branchId
    })

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        roleId: user.roleId,
        roleName: user.role?.name,
        branchId: user.branchId,
        branchName: user.branch?.name,
        permissions: user.role?.permissions?.map((p) => ({
          moduleCode: p.module.code,
          canCreate: p.canCreate,
          canRead: p.canRead,
          canUpdate: p.canUpdate,
          canDelete: p.canDelete
        })) || []
      }
    }
  }

  static async logout(userId: number, ip?: string) {
    await UserRepository.update(userId, {
      activeSessionId: null
    })

    await AuditRepository.create({
      userId,
      action: 'LOGOUT',
      entity: 'User',
      entityId: userId,
      ip
    })

    return { success: true }
  }

  static async changePassword(userId: number, currentPass: string, newPass: string, ip?: string) {
    if (!newPass || newPass.length < 6) {
      throw new ValidationError('La nueva contraseña debe tener al menos 6 caracteres')
    }

    const user = await UserRepository.findById(userId)
    if (!user) {
      throw new UnauthorizedError('Usuario no encontrado')
    }

    const fullUser = await UserRepository.findByUsernameWithPassword(user.username)
    if (!fullUser) {
      throw new UnauthorizedError('Usuario no encontrado')
    }

    const isMatch = await bcrypt.compare(currentPass, fullUser.passwordHash)
    if (!isMatch) {
      throw new ValidationError('La contraseña actual es incorrecta')
    }

    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(newPass, salt)

    await UserRepository.update(userId, { passwordHash })

    await AuditRepository.create({
      userId,
      action: 'CHANGE_PASSWORD',
      entity: 'User',
      entityId: userId,
      ip
    })

    return { success: true }
  }
}

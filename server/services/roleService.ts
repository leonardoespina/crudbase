import { RoleRepository, type CreateRoleInput, type UpdateRoleInput } from '../repository/roleRepository'
import { AuditRepository } from '../repository/auditRepository'
import { ConflictError, NotFoundError, ValidationError, ForbiddenError } from '../domain/errors'
import { eventBus } from '../utils/eventBus'

export class RoleService {
  static async list() {
    return RoleRepository.findAll()
  }

  static async listModules() {
    return RoleRepository.findAllModules()
  }

  static async getById(id: number) {
    const role = await RoleRepository.findById(id)
    if (!role) {
      throw new NotFoundError('Rol', id)
    }
    return role
  }

  static async create(data: CreateRoleInput, actorId: number, ip?: string) {
    if (!data.name) {
      throw new ValidationError('El nombre del rol es obligatorio')
    }

    const existing = await RoleRepository.findByName(data.name)
    if (existing) {
      throw new ConflictError(`Ya existe un rol con el nombre ${data.name}`)
    }

    const role = await RoleRepository.create(data)

    await AuditRepository.create({
      userId: actorId,
      action: 'CREATE',
      entity: 'Role',
      entityId: role?.id,
      details: JSON.stringify({ name: role?.name }),
      ip
    })

    if (role) {
      eventBus.emit('role:updated', { roleId: role.id })
    }

    return role
  }

  static async update(id: number, data: UpdateRoleInput, actorId: number, ip?: string) {
    const existing = await RoleRepository.findById(id)
    if (!existing) {
      throw new NotFoundError('Rol', id)
    }

    if (data.name && data.name !== existing.name) {
      const nameTaken = await RoleRepository.findByName(data.name)
      if (nameTaken) {
        throw new ConflictError(`El nombre ${data.name} ya está en uso por otro rol`)
      }
    }

    const updated = await RoleRepository.update(id, data)

    await AuditRepository.create({
      userId: actorId,
      action: 'UPDATE',
      entity: 'Role',
      entityId: id,
      details: JSON.stringify({ name: updated?.name }),
      ip
    })

    // Invalida caché L1 y notifica por WebSockets
    eventBus.emit('role:updated', { roleId: id })
    return updated
  }

  static async delete(id: number, actorId: number, ip?: string) {
    const existing = await RoleRepository.findById(id)
    if (!existing) {
      throw new NotFoundError('Rol', id)
    }

    if (existing.isSystem) {
      throw new ForbiddenError('Los roles protegidos del sistema no pueden ser eliminados')
    }

    await RoleRepository.delete(id)

    await AuditRepository.create({
      userId: actorId,
      action: 'DELETE',
      entity: 'Role',
      entityId: id,
      details: JSON.stringify({ name: existing.name }),
      ip
    })

    eventBus.emit('role:updated', { roleId: id })
    return { success: true }
  }
}

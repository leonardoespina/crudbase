import { BranchRepository, type CreateBranchInput, type UpdateBranchInput } from '../repository/branchRepository'
import { AuditRepository } from '../repository/auditRepository'
import { ConflictError, NotFoundError, ValidationError } from '../domain/errors'
import { eventBus } from '../utils/eventBus'

export class BranchService {
  static async list(includeInactive = false) {
    return BranchRepository.findAll(includeInactive)
  }

  static async getById(id: number) {
    const branch = await BranchRepository.findById(id)
    if (!branch) {
      throw new NotFoundError('Sede', id)
    }
    return branch
  }

  static async create(data: CreateBranchInput, actorId: number, ip?: string) {
    if (!data.code || !data.name) {
      throw new ValidationError('El código y el nombre de la sede son obligatorios')
    }

    const existing = await BranchRepository.findByCode(data.code)
    if (existing) {
      throw new ConflictError(`Ya existe una sede con el código ${data.code}`)
    }

    const branch = await BranchRepository.create(data)

    await AuditRepository.create({
      userId: actorId,
      action: 'CREATE',
      entity: 'Branch',
      entityId: branch.id,
      details: JSON.stringify(branch),
      ip
    })

    eventBus.emit('branch:updated', { branchId: branch.id })
    return branch
  }

  static async update(id: number, data: UpdateBranchInput, actorId: number, ip?: string) {
    const existing = await BranchRepository.findById(id)
    if (!existing) {
      throw new NotFoundError('Sede', id)
    }

    if (data.code && data.code !== existing.code) {
      const codeTaken = await BranchRepository.findByCode(data.code)
      if (codeTaken) {
        throw new ConflictError(`El código ${data.code} ya está en uso por otra sede`)
      }
    }

    const updated = await BranchRepository.update(id, data)

    await AuditRepository.create({
      userId: actorId,
      action: 'UPDATE',
      entity: 'Branch',
      entityId: id,
      details: JSON.stringify({ before: existing, after: updated }),
      ip
    })

    eventBus.emit('branch:updated', { branchId: id })
    return updated
  }

  static async delete(id: number, actorId: number, ip?: string) {
    const existing = await BranchRepository.findById(id)
    if (!existing) {
      throw new NotFoundError('Sede', id)
    }

    await BranchRepository.delete(id)

    await AuditRepository.create({
      userId: actorId,
      action: 'DELETE',
      entity: 'Branch',
      entityId: id,
      details: JSON.stringify(existing),
      ip
    })

    eventBus.emit('branch:updated', { branchId: id })
    return { success: true }
  }
}

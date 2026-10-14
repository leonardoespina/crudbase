import { prisma } from '../utils/prisma'

export interface CreateAuditLogInput {
  userId?: number | null
  action: string
  entity: string
  entityId?: number | null
  details?: string
  ip?: string
}

export class AuditRepository {
  static async create(data: CreateAuditLogInput) {
    return prisma.auditLog.create({
      data
    })
  }

  static async findAll(limit = 100, entity?: string) {
    const where: any = {}
    if (entity) {
      where.entity = entity
    }

    return prisma.auditLog.findMany({
      where,
      take: limit,
      include: {
        user: {
          select: { id: true, username: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  }
}

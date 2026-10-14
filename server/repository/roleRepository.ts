import { prisma } from '../utils/prisma'

export interface CreateRoleInput {
  name: string
  description?: string
  permissions?: {
    moduleId: number
    canCreate: boolean
    canRead: boolean
    canUpdate: boolean
    canDelete: boolean
  }[]
}

export interface UpdateRoleInput {
  name?: string
  description?: string
  permissions?: {
    moduleId: number
    canCreate: boolean
    canRead: boolean
    canUpdate: boolean
    canDelete: boolean
  }[]
}

export class RoleRepository {
  static async findAll() {
    return prisma.role.findMany({
      include: {
        permissions: {
          include: { module: true }
        },
        _count: {
          select: { users: true }
        }
      },
      orderBy: { name: 'asc' }
    })
  }

  static async findById(id: number) {
    return prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: { module: true }
        }
      }
    })
  }

  static async findByName(name: string) {
    return prisma.role.findUnique({
      where: { name }
    })
  }

  static async create(data: CreateRoleInput) {
    return prisma.$transaction(async (tx) => {
      const role = await tx.role.create({
        data: {
          name: data.name,
          description: data.description
        }
      })

      if (data.permissions && data.permissions.length > 0) {
        await tx.rolePermission.createMany({
          data: data.permissions.map((p) => ({
            roleId: role.id,
            moduleId: p.moduleId,
            canCreate: p.canCreate,
            canRead: p.canRead,
            canUpdate: p.canUpdate,
            canDelete: p.canDelete
          }))
        })
      }

      return tx.role.findUnique({
        where: { id: role.id },
        include: { permissions: { include: { module: true } } }
      })
    })
  }

  static async update(id: number, data: UpdateRoleInput) {
    return prisma.$transaction(async (tx) => {
      const role = await tx.role.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description
        }
      })

      if (data.permissions) {
        // Eliminar permisos anteriores
        await tx.rolePermission.deleteMany({
          where: { roleId: id }
        })

        // Insertar matriz actualizada
        if (data.permissions.length > 0) {
          await tx.rolePermission.createMany({
            data: data.permissions.map((p) => ({
              roleId: id,
              moduleId: p.moduleId,
              canCreate: p.canCreate,
              canRead: p.canRead,
              canUpdate: p.canUpdate,
              canDelete: p.canDelete
            }))
          })
        }
      }

      return tx.role.findUnique({
        where: { id },
        include: { permissions: { include: { module: true } } }
      })
    })
  }

  static async delete(id: number) {
    return prisma.role.delete({
      where: { id }
    })
  }

  static async findAllModules() {
    return prisma.module.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }]
    })
  }
}

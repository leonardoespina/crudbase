import { prisma } from '../utils/prisma'

export interface CreateUserInput {
  username: string
  name: string
  email?: string
  passwordHash: string
  roleId: number
  branchId?: number | null
  active?: boolean
}

export interface UpdateUserInput {
  name?: string
  email?: string
  passwordHash?: string
  roleId?: number
  branchId?: number | null
  active?: boolean
  activeSessionId?: string | null
}

export class UserRepository {
  static async findAll(branchId?: number | null) {
    const where: any = {}
    if (branchId) {
      where.branchId = branchId
    }

    return prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        active: true,
        roleId: true,
        branchId: true,
        lastActiveAt: true,
        createdAt: true,
        role: {
          select: { id: true, name: true, description: true }
        },
        branch: {
          select: { id: true, code: true, name: true }
        }
      },
      orderBy: { name: 'asc' }
    })
  }

  static async findById(id: number) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        active: true,
        roleId: true,
        branchId: true,
        lastActiveAt: true,
        createdAt: true,
        role: {
          select: { id: true, name: true, description: true }
        },
        branch: {
          select: { id: true, code: true, name: true }
        }
      }
    })
  }

  static async findByUsernameWithPassword(username: string) {
    return prisma.user.findUnique({
      where: { username },
      include: {
        role: {
          include: {
            permissions: {
              include: { module: true }
            }
          }
        },
        branch: true
      }
    })
  }

  static async create(data: CreateUserInput) {
    return prisma.user.create({
      data,
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        active: true,
        roleId: true,
        branchId: true,
        createdAt: true
      }
    })
  }

  static async update(id: number, data: UpdateUserInput) {
    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        active: true,
        roleId: true,
        branchId: true,
        updatedAt: true
      }
    })
  }

  static async delete(id: number) {
    return prisma.user.delete({
      where: { id }
    })
  }
}

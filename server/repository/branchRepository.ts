import { prisma } from '../utils/prisma'

export interface CreateBranchInput {
  code: string
  name: string
  description?: string
  active?: boolean
}

export interface UpdateBranchInput {
  code?: string
  name?: string
  description?: string
  active?: boolean
}

export class BranchRepository {
  static async findAll(includeInactive = false) {
    return prisma.branch.findMany({
      where: includeInactive ? {} : { active: true },
      orderBy: { name: 'asc' }
    })
  }

  static async findById(id: number) {
    return prisma.branch.findUnique({
      where: { id }
    })
  }

  static async findByCode(code: string) {
    return prisma.branch.findUnique({
      where: { code }
    })
  }

  static async create(data: CreateBranchInput) {
    return prisma.branch.create({
      data
    })
  }

  static async update(id: number, data: UpdateBranchInput) {
    return prisma.branch.update({
      where: { id },
      data
    })
  }

  static async delete(id: number) {
    return prisma.branch.delete({
      where: { id }
    })
  }
}

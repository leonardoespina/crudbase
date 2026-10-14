import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

// Inicialización base
const basePrisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
})

// Modelos con soft delete
const SOFT_DELETE_MODELS = ['User', 'Role', 'Branch']

// Extensión para Soft Delete y Anti-Leak de contraseñas
export const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async findMany({ model, args, query }) {
        if (SOFT_DELETE_MODELS.includes(model)) {
          args.where = { deletedAt: null, ...args.where }
        }
        return query(args)
      },
      async findFirst({ model, args, query }) {
        if (SOFT_DELETE_MODELS.includes(model)) {
          args.where = { deletedAt: null, ...args.where }
        }
        return query(args)
      },
      async findUnique({ model, args, query }) {
        return query(args)
      },
      async delete({ model, args }) {
        if (SOFT_DELETE_MODELS.includes(model)) {
          return (basePrisma as any)[model.toLowerCase()].update({
            where: args.where,
            data: { deletedAt: new Date() }
          })
        }
        return (basePrisma as any)[model.toLowerCase()].delete(args)
      },
      async deleteMany({ model, args }) {
        if (SOFT_DELETE_MODELS.includes(model)) {
          return (basePrisma as any)[model.toLowerCase()].updateMany({
            where: args.where,
            data: { deletedAt: new Date() }
          })
        }
        return (basePrisma as any)[model.toLowerCase()].deleteMany(args)
      }
    }
  }
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = basePrisma
}

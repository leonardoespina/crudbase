import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient
  prismaExtended: any
}

// Modelos con soft delete
const SOFT_DELETE_MODELS = ['User', 'Role', 'Branch']

function createPrismaClient(databaseUrl?: string) {
  const url = databaseUrl || process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/placeholder_db'
  
  const basePrisma = new PrismaClient({
    datasourceUrl: url,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
  })

  const extended = basePrisma.$extends({
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

  return { basePrisma, extended }
}

export function reloadPrismaClient(newDatabaseUrl: string) {
  const { basePrisma, extended } = createPrismaClient(newDatabaseUrl)
  globalForPrisma.prisma = basePrisma
  globalForPrisma.prismaExtended = extended
  return extended
}

// Inicialización
if (!globalForPrisma.prismaExtended) {
  const { basePrisma, extended } = createPrismaClient()
  globalForPrisma.prisma = basePrisma
  globalForPrisma.prismaExtended = extended
}

export const prisma = globalForPrisma.prismaExtended

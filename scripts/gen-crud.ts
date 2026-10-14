import fs from 'fs'
import path from 'path'

const args = process.argv.slice(2)
if (args.length === 0) {
  console.error('❌ Debes proporcionar el nombre de la entidad en PascalCase (Ej: Product, Client, Vehicle)')
  console.log('   Uso: npm run gen:crud -- Product')
  process.exit(1)
}

const entity = args[0]
const entityLower = entity.charAt(0).toLowerCase() + entity.slice(1)
const entityPlural = entityLower.endsWith('s') ? entityLower : entityLower + 's'
const entityPluralUpper = entityPlural.toUpperCase()

console.log(`🚀 Generando módulo CRUD para: ${entity} (${entityPlural})...`)

// 1. Repository
const repoContent = `import { prisma } from '../utils/prisma'

export interface Create${entity}Input {
  name: string
  description?: string
  branchId?: number | null
}

export interface Update${entity}Input {
  name?: string
  description?: string
}

export class ${entity}Repository {
  static async findAll(branchId?: number | null) {
    const where: any = {}
    if (branchId) {
      where.branchId = branchId
    }
    return (prisma as any).${entityLower}.findMany({
      where,
      orderBy: { name: 'asc' }
    })
  }

  static async findById(id: number) {
    return (prisma as any).${entityLower}.findUnique({
      where: { id }
    })
  }

  static async create(data: Create${entity}Input) {
    return (prisma as any).${entityLower}.create({
      data
    })
  }

  static async update(id: number, data: Update${entity}Input) {
    return (prisma as any).${entityLower}.update({
      where: { id },
      data
    })
  }

  static async delete(id: number) {
    return (prisma as any).${entityLower}.delete({
      where: { id }
    })
  }
}
`
fs.writeFileSync(path.join(process.cwd(), `server/repository/${entityLower}Repository.ts`), repoContent)

// 2. Service
const serviceContent = `import { ${entity}Repository, type Create${entity}Input, type Update${entity}Input } from '../repository/${entityLower}Repository'
import { AuditRepository } from '../repository/auditRepository'
import { NotFoundError, ValidationError } from '../domain/errors'
import type { UserContext } from '../utils/auth'

export class ${entity}Service {
  static async list(actor: UserContext) {
    const branchFilter = actor.isAdmin ? null : actor.branchId
    return ${entity}Repository.findAll(branchFilter)
  }

  static async getById(id: number, actor: UserContext) {
    const item = await ${entity}Repository.findById(id)
    if (!item) {
      throw new NotFoundError('${entity}', id)
    }
    if (!actor.isAdmin && item.branchId && item.branchId !== actor.branchId) {
      throw new NotFoundError('${entity}', id)
    }
    return item
  }

  static async create(data: Create${entity}Input, actor: UserContext, ip?: string) {
    if (!data.name) {
      throw new ValidationError('El nombre es obligatorio')
    }

    const branchId = actor.isAdmin ? data.branchId : actor.branchId
    const item = await ${entity}Repository.create({
      ...data,
      branchId
    })

    await AuditRepository.create({
      userId: actor.id,
      action: 'CREATE',
      entity: '${entity}',
      entityId: item.id,
      details: JSON.stringify(item),
      ip
    })

    return item
  }

  static async update(id: number, data: Update${entity}Input, actor: UserContext, ip?: string) {
    await this.getById(id, actor)
    const updated = await ${entity}Repository.update(id, data)

    await AuditRepository.create({
      userId: actor.id,
      action: 'UPDATE',
      entity: '${entity}',
      entityId: id,
      details: JSON.stringify(updated),
      ip
    })

    return updated
  }

  static async delete(id: number, actor: UserContext, ip?: string) {
    await this.getById(id, actor)
    await ${entity}Repository.delete(id)

    await AuditRepository.create({
      userId: actor.id,
      action: 'DELETE',
      entity: '${entity}',
      entityId: id,
      ip
    })

    return { success: true }
  }
}
`
fs.writeFileSync(path.join(process.cwd(), `server/services/${entityLower}Service.ts`), serviceContent)

// 3. API Handlers
const apiDir = path.join(process.cwd(), `server/api/${entityPlural}`)
if (!fs.existsSync(apiDir)) fs.mkdirSync(apiDir, { recursive: true })

fs.writeFileSync(path.join(apiDir, 'index.get.ts'), `import { defineApiHandler } from '../../utils/handler'
import { requirePermission } from '../../utils/auth'
import { ${entity}Service } from '../../services/${entityLower}Service'

export default defineApiHandler(async (event) => {
  const actor = await requirePermission(event, '${entityPluralUpper}', 'read')
  return ${entity}Service.list(actor)
})
`)

fs.writeFileSync(path.join(apiDir, 'index.post.ts'), `import { z } from 'zod'
import { defineApiHandler } from '../../utils/handler'
import { requirePermission } from '../../utils/auth'
import { ${entity}Service } from '../../services/${entityLower}Service'
import { withIdempotency } from '../../utils/idempotency'

const schema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  branchId: z.number().nullable().optional()
})

export default defineApiHandler(async (event) => {
  const actor = await requirePermission(event, '${entityPluralUpper}', 'create')
  const body = await readBody(event)
  const valid = schema.parse(body)
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'

  return withIdempotency(event, () =>
    ${entity}Service.create(valid, actor, ip)
  )
})
`)

fs.writeFileSync(path.join(apiDir, '[id].put.ts'), `import { z } from 'zod'
import { defineApiHandler } from '../../utils/handler'
import { requirePermission } from '../../utils/auth'
import { ${entity}Service } from '../../services/${entityLower}Service'

const schema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional()
})

export default defineApiHandler(async (event) => {
  const actor = await requirePermission(event, '${entityPluralUpper}', 'update')
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)
  const valid = schema.parse(body)
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'

  return ${entity}Service.update(id, valid, actor, ip)
})
`)

fs.writeFileSync(path.join(apiDir, '[id].delete.ts'), `import { defineApiHandler } from '../../utils/handler'
import { requirePermission } from '../../utils/auth'
import { ${entity}Service } from '../../services/${entityLower}Service'

export default defineApiHandler(async (event) => {
  const actor = await requirePermission(event, '${entityPluralUpper}', 'delete')
  const id = Number(getRouterParam(event, 'id'))
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'

  return ${entity}Service.delete(id, actor, ip)
})
`)

// 4. Pinia Store
const storeContent = `import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface ${entity}Item {
  id: number
  name: string
  description?: string | null
  branchId?: number | null
  createdAt: string
}

export const use${entity}Store = defineStore('${entityPlural}', () => {
  const items = ref<${entity}Item[]>([])
  const loading = ref(false)

  async function fetchItems(force = false) {
    if (items.value.length > 0 && !force) return
    loading.value = true
    try {
      items.value = await $fetch('/api/${entityPlural}')
    } finally {
      loading.value = false
    }
  }

  async function create(data: Partial<${entity}Item>) {
    const created: ${entity}Item = await $fetch('/api/${entityPlural}', {
      method: 'POST',
      body: data
    })
    items.value.unshift(created)
    return created
  }

  async function update(id: number, data: Partial<${entity}Item>) {
    const updated: ${entity}Item = await $fetch(\`/api/${entityPlural}/\${id}\`, {
      method: 'PUT',
      body: data
    })
    const idx = items.value.findIndex((i) => i.id === id)
    if (idx !== -1) items.value[idx] = updated
    return updated
  }

  async function remove(id: number) {
    await $fetch(\`/api/${entityPlural}/\${id}\`, {
      method: 'DELETE'
    })
    items.value = items.value.filter((i) => i.id !== id)
  }

  return {
    items,
    loading,
    fetchItems,
    create,
    update,
    remove
  }
})
`
fs.writeFileSync(path.join(process.cwd(), `app/stores/${entityPlural}.ts`), storeContent)

console.log(`✅ ¡Módulo para '${entity}' generado con éxito!`)
console.log(`\n📋 Siguientes pasos:`)
console.log(`1. Agrega el modelo a prisma/schema.prisma:`)
console.log(`
model ${entity} {
  id          Int       @id @default(autoincrement())
  name        String
  description String?
  branchId    Int?      @map("branch_id")
  branch      Branch?   @relation(fields: [branchId], references: [id])
  deletedAt   DateTime? @map("deleted_at")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  @@map("${entityPlural}")
}
`)
console.log(`2. Registra el módulo '${entityPluralUpper}' en prisma/seed.ts`)
console.log(`3. Ejecuta: npx prisma db push`)

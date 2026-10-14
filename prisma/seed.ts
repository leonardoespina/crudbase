import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed de datos base...')

  // 1. Módulos Base del Sistema
  const modulesData = [
    { code: 'USERS', name: 'Gestión de Usuarios', category: 'SEGURIDAD' },
    { code: 'ROLES', name: 'Roles y Permisos', category: 'SEGURIDAD' },
    { code: 'BRANCHES', name: 'Gestión de Sedes', category: 'CATALOGOS' },
    { code: 'AUDIT', name: 'Auditoría del Sistema', category: 'SEGURIDAD' },
    { code: 'SETTINGS', name: 'Configuración Global', category: 'SEGURIDAD' }
  ]

  const modules = []
  for (const m of modulesData) {
    const mod = await prisma.module.upsert({
      where: { code: m.code },
      update: { name: m.name, category: m.category },
      create: m
    })
    modules.push(mod)
  }
  console.log(`✅ ${modules.length} Módulos registrados`)

  // 2. Sede Principal por Defecto
  const centralBranch = await prisma.branch.upsert({
    where: { code: 'CENTRAL' },
    update: {},
    create: {
      code: 'CENTRAL',
      name: 'Sede Principal',
      description: 'Oficina Central / Matriz',
      active: true
    }
  })
  console.log(`✅ Sede por defecto creada: ${centralBranch.name}`)

  // 3. Rol ADMIN (Sistema) y OPERATOR
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: { isSystem: true },
    create: {
      name: 'ADMIN',
      description: 'Administrador con acceso total a todas las funciones y sedes',
      isSystem: true
    }
  })

  const operatorRole = await prisma.role.upsert({
    where: { name: 'OPERATOR' },
    update: {},
    create: {
      name: 'OPERATOR',
      description: 'Operador de sede con permisos de consulta y operación básica',
      isSystem: false
    }
  })
  console.log('✅ Roles base creados: ADMIN, OPERATOR')

  // 4. Otorgar permisos completos al Rol ADMIN
  for (const mod of modules) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_moduleId: {
          roleId: adminRole.id,
          moduleId: mod.id
        }
      },
      update: {
        canCreate: true,
        canRead: true,
        canUpdate: true,
        canDelete: true
      },
      create: {
        roleId: adminRole.id,
        moduleId: mod.id,
        canCreate: true,
        canRead: true,
        canUpdate: true,
        canDelete: true
      }
    })
  }

  // Permisos básicos para OPERATOR
  for (const mod of modules) {
    const canRead = ['BRANCHES', 'USERS'].includes(mod.code)
    await prisma.rolePermission.upsert({
      where: {
        roleId_moduleId: {
          roleId: operatorRole.id,
          moduleId: mod.id
        }
      },
      update: { canRead, canCreate: false, canUpdate: false, canDelete: false },
      create: {
        roleId: operatorRole.id,
        moduleId: mod.id,
        canRead,
        canCreate: false,
        canUpdate: false,
        canDelete: false
      }
    })
  }
  console.log('✅ Matriz de permisos inicial configurada')

  // 5. Usuario Administrador Inicial
  const salt = await bcrypt.genSalt(10)
  const passwordHash = await bcrypt.hash('admin1234', salt)

  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      roleId: adminRole.id,
      active: true
    },
    create: {
      username: 'admin',
      name: 'Administrador General',
      email: 'admin@empresa.local',
      passwordHash,
      roleId: adminRole.id,
      branchId: null, // Acceso global
      active: true
    }
  })
  console.log(`✅ Usuario Admin creado: ${adminUser.username} (contraseña inicial: admin1234)`)

  // 6. Configuraciones de Sistema Iniciales
  await prisma.systemSetting.upsert({
    where: { key: 'SYSTEM_NAME' },
    update: {},
    create: {
      key: 'SYSTEM_NAME',
      value: 'CRUDBASE',
      description: 'Nombre de la aplicación mostrado en la interfaz'
    }
  })

  console.log('🚀 Seed completado exitosamente.')
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

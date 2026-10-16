import bcrypt from 'bcryptjs'
import { prisma } from '../utils/prisma'
import { ForbiddenError, ValidationError } from '../domain/errors'
import { eventBus } from '../utils/eventBus'

export interface InstallPayload {
  company: {
    name: string
    taxId?: string
    logo?: string
    timezone?: string
  }
  branch: {
    code: string
    name: string
    description?: string
  }
  admin: {
    username: string
    name: string
    email?: string
    password: string
  }
}

export class SetupService {
  /**
   * Verifica si el sistema ya se encuentra instalado.
   */
  static async isInstalled(): Promise<boolean> {
    try {
      const setting = await prisma.systemSetting.findUnique({
        where: { key: 'SYSTEM_INSTALLED' }
      })

      if (setting?.value === 'true') {
        return true
      }

      // Doble verificación: si ya existen usuarios registrados, el sistema está en uso
      const userCount = await prisma.user.count()
      return userCount > 0
    } catch {
      return false
    }
  }

  /**
   * Obtiene la configuración pública de la empresa (Nombre, Logo, Zona Horaria)
   */
  static async getPublicSettings() {
    try {
      const settings = await prisma.systemSetting.findMany({
        where: {
          key: {
            in: ['COMPANY_NAME', 'COMPANY_TAX_ID', 'COMPANY_LOGO', 'APP_TIMEZONE', 'SYSTEM_INSTALLED']
          }
        }
      })

      const map = settings.reduce((acc: Record<string, string>, curr) => {
        acc[curr.key] = curr.value
        return acc
      }, {})

      return {
        appName: map['COMPANY_NAME'] || process.env.APP_NAME || 'CRUDBASE',
        taxId: map['COMPANY_TAX_ID'] || '',
        logo: map['COMPANY_LOGO'] || null,
        timezone: map['APP_TIMEZONE'] || process.env.APP_TIMEZONE || 'America/Caracas',
        isInstalled: map['SYSTEM_INSTALLED'] === 'true'
      }
    } catch {
      return {
        appName: process.env.APP_NAME || 'CRUDBASE',
        taxId: '',
        logo: null,
        timezone: process.env.APP_TIMEZONE || 'America/Caracas',
        isInstalled: false
      }
    }
  }

  /**
   * Ejecuta la instalación inicial del sistema de forma atómica.
   */
  static async install(payload: InstallPayload, ip?: string) {
    const alreadyInstalled = await this.isInstalled()
    if (alreadyInstalled) {
      throw new ForbiddenError('El sistema ya se encuentra instalado y configurado')
    }

    if (!payload.company?.name) {
      throw new ValidationError('El nombre de la empresa es obligatorio')
    }
    if (!payload.branch?.code || !payload.branch?.name) {
      throw new ValidationError('El código y nombre de la sede principal son obligatorios')
    }
    if (!payload.admin?.username || !payload.admin?.password || payload.admin.password.length < 6) {
      throw new ValidationError('El usuario y una contraseña de mínimo 6 caracteres son obligatorios')
    }

    return prisma.$transaction(async (tx) => {
      // 1. Registrar Módulos Base
      const modulesData = [
        { code: 'USERS', name: 'Gestión de Usuarios', category: 'SEGURIDAD' },
        { code: 'ROLES', name: 'Roles y Permisos', category: 'SEGURIDAD' },
        { code: 'BRANCHES', name: 'Gestión de Sedes', category: 'CATALOGOS' },
        { code: 'AUDIT', name: 'Auditoría del Sistema', category: 'SEGURIDAD' },
        { code: 'SETTINGS', name: 'Configuración Global', category: 'SEGURIDAD' }
      ]

      const modules = []
      for (const m of modulesData) {
        const mod = await tx.module.upsert({
          where: { code: m.code },
          update: { name: m.name, category: m.category },
          create: m
        })
        modules.push(mod)
      }

      // 2. Crear Sede Matriz Principal
      const mainBranch = await tx.branch.create({
        data: {
          code: payload.branch.code.trim().toUpperCase(),
          name: payload.branch.name.trim(),
          description: payload.branch.description?.trim() || 'Sede Principal / Matriz',
          active: true
        }
      })

      // 3. Crear Rol ADMIN y OPERATOR
      const adminRole = await tx.role.create({
        data: {
          name: 'ADMIN',
          description: 'Administrador General del Sistema con Acceso Total',
          isSystem: true
        }
      })

      const operatorRole = await tx.role.create({
        data: {
          name: 'OPERATOR',
          description: 'Operador Estándar de Sede',
          isSystem: false
        }
      })

      // 4. Otorgar permisos completos al Rol ADMIN
      for (const mod of modules) {
        await tx.rolePermission.create({
          data: {
            roleId: adminRole.id,
            moduleId: mod.id,
            canCreate: true,
            canRead: true,
            canUpdate: true,
            canDelete: true
          }
        })
      }

      // Permisos iniciales para OPERATOR
      for (const mod of modules) {
        const canRead = ['BRANCHES', 'USERS'].includes(mod.code)
        await tx.rolePermission.create({
          data: {
            roleId: operatorRole.id,
            moduleId: mod.id,
            canRead,
            canCreate: false,
            canUpdate: false,
            canDelete: false
          }
        })
      }

      // 5. Crear Usuario Administrador Maestro
      const salt = await bcrypt.genSalt(10)
      const passwordHash = await bcrypt.hash(payload.admin.password, salt)

      const adminUser = await tx.user.create({
        data: {
          username: payload.admin.username.trim().toLowerCase(),
          name: payload.admin.name.trim() || 'Administrador General',
          email: payload.admin.email?.trim() || null,
          passwordHash,
          roleId: adminRole.id,
          branchId: null, // Acceso global irrestricto
          active: true
        }
      })

      // 6. Guardar Configuraciones de la Empresa y Sellar Instalación
      const settingsToSave = [
        { key: 'COMPANY_NAME', value: payload.company.name.trim(), description: 'Nombre de la empresa' },
        { key: 'COMPANY_TAX_ID', value: payload.company.taxId?.trim() || '', description: 'Identificación fiscal' },
        { key: 'COMPANY_LOGO', value: payload.company.logo || '', description: 'Logotipo corporativo en Base64' },
        { key: 'APP_TIMEZONE', value: payload.company.timezone || 'America/Caracas', description: 'Zona horaria comercial' },
        { key: 'SYSTEM_INSTALLED', value: 'true', description: 'Bandera permanente de instalación' }
      ]

      for (const s of settingsToSave) {
        await tx.systemSetting.upsert({
          where: { key: s.key },
          update: { value: s.value },
          create: s
        })
      }

      // 7. Registrar Auditoría del evento de instalación
      await tx.auditLog.create({
        data: {
          userId: adminUser.id,
          action: 'SYSTEM_INSTALLATION',
          entity: 'SystemSetting',
          details: JSON.stringify({
            company: payload.company.name,
            branch: mainBranch.name,
            admin: adminUser.username
          }),
          ip
        }
      })

      return {
        success: true,
        message: 'Sistema aprovisionado e instalado correctamente'
      }
    })
  }

  /**
   * Actualiza la configuración de la empresa (Post-Instalación)
   */
  static async updateSettings(
    data: { name?: string; taxId?: string; logo?: string; timezone?: string },
    actorId: number,
    ip?: string
  ) {
    if (data.name) {
      await prisma.systemSetting.upsert({
        where: { key: 'COMPANY_NAME' },
        update: { value: data.name },
        create: { key: 'COMPANY_NAME', value: data.name }
      })
    }
    if (data.taxId !== undefined) {
      await prisma.systemSetting.upsert({
        where: { key: 'COMPANY_TAX_ID' },
        update: { value: data.taxId },
        create: { key: 'COMPANY_TAX_ID', value: data.taxId }
      })
    }
    if (data.logo !== undefined) {
      await prisma.systemSetting.upsert({
        where: { key: 'COMPANY_LOGO' },
        update: { value: data.logo },
        create: { key: 'COMPANY_LOGO', value: data.logo }
      })
    }
    if (data.timezone) {
      await prisma.systemSetting.upsert({
        where: { key: 'APP_TIMEZONE' },
        update: { value: data.timezone },
        create: { key: 'APP_TIMEZONE', value: data.timezone }
      })
    }

    await prisma.auditLog.create({
      data: {
        userId: actorId,
        action: 'UPDATE_SETTINGS',
        entity: 'SystemSetting',
        details: JSON.stringify(data),
        ip
      }
    })

    eventBus.emit('setting:updated', { key: 'COMPANY_NAME', value: data.name || '' })
    return { success: true }
  }
}

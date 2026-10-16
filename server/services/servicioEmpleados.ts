import { prisma } from '../utils/prisma'
import { ConflictError, NotFoundError, ValidationError } from '../domain/errors'
import { logAudit } from '../utils/audit'
import type { UserContext } from '../utils/auth'

export interface FiltrosEmpleado {
  busqueda?: string
  sedeId?: number
  gerenciaId?: number
  cargoId?: number
  bloqueadoParaPago?: boolean
  activo?: boolean
  pagina?: number
  limite?: number
  todos?: boolean
}

export interface DatosCrearEmpleado {
  cedula: string
  nombres: string
  apellidos: string
  correo?: string
  telefono?: string
  sedeId: number
  gerenciaId: number
  cargoId: number
  nivelSalarialId?: number
}

export interface DatosActualizarEmpleado {
  cedula?: string
  nombres?: string
  apellidos?: string
  correo?: string
  telefono?: string
  sedeId?: number
  gerenciaId?: number
  cargoId?: number
  nivelSalarialId?: number
  activo?: boolean
}

export class ServicioEmpleados {
  /**
   * Lista empleados con soporte multisede, filtros cruzados y paginación
   */
  static async listar(filtros: FiltrosEmpleado = {}, actor?: UserContext) {
    const pagina = Math.max(1, Number(filtros.pagina) || 1)
    const limite = Math.min(200, Math.max(1, Number(filtros.limite) || 50))
    const salto = (pagina - 1) * limite

    const where: any = {}

    // Aislamiento multisede: si no es ADMIN, forzar su sede
    if (actor && !actor.isAdmin && actor.branchId) {
      where.sedeId = actor.branchId
    } else if (filtros.sedeId) {
      where.sedeId = Number(filtros.sedeId)
    }

    if (filtros.gerenciaId) {
      where.gerenciaId = Number(filtros.gerenciaId)
    }

    if (filtros.cargoId) {
      where.cargoId = Number(filtros.cargoId)
    }

    if (filtros.bloqueadoParaPago !== undefined) {
      where.bloqueadoParaPago = filtros.bloqueadoParaPago
    }

    if (filtros.activo !== undefined) {
      where.activo = filtros.activo
    }

    if (filtros.busqueda?.trim()) {
      const termino = filtros.busqueda.trim()
      where.OR = [
        { cedula: { contains: termino, mode: 'insensitive' } },
        { nombres: { contains: termino, mode: 'insensitive' } },
        { apellidos: { contains: termino, mode: 'insensitive' } }
      ]
    }

    const include = {
      sede: { select: { id: true, code: true, name: true } },
      gerencia: { select: { id: true, codigo: true, nombre: true } },
      cargo: { select: { id: true, codigo: true, nombre: true } },
      nivelSalarial: { select: { id: true, codigo: true, nombre: true } }
    }

    if (filtros.todos) {
      const items = await prisma.empleado.findMany({
        where,
        include,
        orderBy: [{ apellidos: 'asc' }, { nombres: 'asc' }]
      })
      return {
        items,
        meta: { total: items.length, page: 1, limit: items.length, totalPages: 1 }
      }
    }

    const [items, total] = await Promise.all([
      prisma.empleado.findMany({
        where,
        include,
        skip: salto,
        take: limite,
        orderBy: [{ apellidos: 'asc' }, { nombres: 'asc' }]
      }),
      prisma.empleado.count({ where })
    ])

    return {
      items,
      meta: {
        total,
        page: pagina,
        limit: limite,
        totalPages: Math.ceil(total / limite) || 1
      }
    }
  }

  /**
   * Obtiene un empleado por su ID con sus relaciones
   */
  static async obtenerPorId(id: number, actor?: UserContext) {
    const empleado = await prisma.empleado.findUnique({
      where: { id },
      include: {
        sede: true,
        gerencia: true,
        cargo: true,
        nivelSalarial: true,
        bloqueos: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    })

    if (!empleado) {
      throw new NotFoundError('Empleado', id)
    }

    // Validación multisede
    if (actor && !actor.isAdmin && actor.branchId && empleado.sedeId !== actor.branchId) {
      throw new NotFoundError('Empleado', id)
    }

    return empleado
  }

  /**
   * Obtiene un empleado por su Cédula de Identidad
   */
  static async obtenerPorCedula(cedula: string, actor?: UserContext) {
    const cedulaLimpia = cedula.trim().toUpperCase()
    const empleado = await prisma.empleado.findUnique({
      where: { cedula: cedulaLimpia },
      include: {
        sede: true,
        gerencia: true,
        cargo: true,
        nivelSalarial: true
      }
    })

    if (!empleado) {
      throw new NotFoundError(`Empleado con cédula ${cedulaLimpia}`)
    }

    if (actor && !actor.isAdmin && actor.branchId && empleado.sedeId !== actor.branchId) {
      throw new NotFoundError(`Empleado con cédula ${cedulaLimpia}`)
    }

    return empleado
  }

  /**
   * Crea un nuevo empleado en el sistema
   */
  static async crear(datos: DatosCrearEmpleado, actor?: UserContext, ip?: string) {
    const cedulaLimpia = datos.cedula.trim().toUpperCase()
    const nombresLimpios = datos.nombres.trim()
    const apellidosLimpios = datos.apellidos.trim()

    if (!cedulaLimpia || !nombresLimpios || !apellidosLimpios) {
      throw new ValidationError('Cédula, nombres y apellidos son campos obligatorios')
    }

    // Asignar sede según el actor si no es admin
    let sedeFinalId = datos.sedeId
    if (actor && !actor.isAdmin && actor.branchId) {
      sedeFinalId = actor.branchId
    }

    // Validar unicidad de cédula
    const existe = await prisma.empleado.findUnique({
      where: { cedula: cedulaLimpia }
    })
    if (existe) {
      throw new ConflictError(`Ya existe un empleado registrado con la cédula '${cedulaLimpia}'`)
    }

    // Validar existencia de sede, gerencia y cargo
    const [sedeExiste, gerenciaExiste, cargoExiste] = await Promise.all([
      prisma.branch.findUnique({ where: { id: sedeFinalId } }),
      prisma.gerencia.findUnique({ where: { id: datos.gerenciaId } }),
      prisma.cargo.findUnique({ where: { id: datos.cargoId } })
    ])

    if (!sedeExiste) throw new ValidationError('La sede especificada no existe')
    if (!gerenciaExiste) throw new ValidationError('La gerencia especificada no existe')
    if (!cargoExiste) throw new ValidationError('El cargo especificado no existe')

    return prisma.$transaction(async (tx) => {
      const nuevo = await tx.empleado.create({
        data: {
          cedula: cedulaLimpia,
          nombres: nombresLimpios,
          apellidos: apellidosLimpios,
          correo: datos.correo?.trim().toLowerCase() || null,
          telefono: datos.telefono?.trim() || null,
          sedeId: sedeFinalId,
          gerenciaId: datos.gerenciaId,
          cargoId: datos.cargoId,
          nivelSalarialId: datos.nivelSalarialId || null,
          bloqueadoParaPago: false
        },
        include: {
          sede: true,
          gerencia: true,
          cargo: true,
          nivelSalarial: true
        }
      })

      if (actor?.id) {
        await logAudit(tx, {
          userId: actor.id,
          action: 'CREATE',
          entity: 'Empleado',
          entityId: nuevo.id,
          newValues: nuevo,
          ipAddress: ip
        })
      }

      return nuevo
    })
  }

  /**
   * Actualiza los datos de un empleado
   */
  static async actualizar(id: number, datos: DatosActualizarEmpleado, actor?: UserContext, ip?: string) {
    const actual = await this.obtenerPorId(id, actor)

    const dataToUpdate: any = {}

    if (datos.cedula) {
      const cedulaLimpia = datos.cedula.trim().toUpperCase()
      if (cedulaLimpia !== actual.cedula) {
        const existe = await prisma.empleado.findFirst({
          where: { cedula: cedulaLimpia, id: { not: id } }
        })
        if (existe) {
          throw new ConflictError(`Ya existe otro empleado con la cédula '${cedulaLimpia}'`)
        }
        dataToUpdate.cedula = cedulaLimpia
      }
    }

    if (datos.nombres) dataToUpdate.nombres = datos.nombres.trim()
    if (datos.apellidos) dataToUpdate.apellidos = datos.apellidos.trim()
    if (datos.correo !== undefined) dataToUpdate.correo = datos.correo?.trim().toLowerCase() || null
    if (datos.telefono !== undefined) dataToUpdate.telefono = datos.telefono?.trim() || null

    if (datos.gerenciaId) dataToUpdate.gerenciaId = datos.gerenciaId
    if (datos.cargoId) dataToUpdate.cargoId = datos.cargoId
    if (datos.nivelSalarialId !== undefined) dataToUpdate.nivelSalarialId = datos.nivelSalarialId || null
    if (datos.activo !== undefined) dataToUpdate.activo = datos.activo

    // Solo ADMIN puede cambiar de sede a un empleado
    if (datos.sedeId && actor?.isAdmin) {
      dataToUpdate.sedeId = datos.sedeId
    }

    return prisma.$transaction(async (tx) => {
      const actualizado = await tx.empleado.update({
        where: { id },
        data: dataToUpdate,
        include: {
          sede: true,
          gerencia: true,
          cargo: true,
          nivelSalarial: true
        }
      })

      if (actor?.id) {
        await logAudit(tx, {
          userId: actor.id,
          action: 'UPDATE',
          entity: 'Empleado',
          entityId: id,
          oldValues: actual,
          newValues: actualizado,
          ipAddress: ip
        })
      }

      return actualizado
    })
  }

  /**
   * Bloqueo Preventivo de Pagos (Reemplaza frmGpersonalComp en VB6)
   */
  static async cambiarBloqueoPago(
    empleadoId: number,
    bloquear: boolean,
    motivo: string,
    actor: UserContext,
    ip?: string
  ) {
    const empleado = await this.obtenerPorId(empleadoId, actor)
    const motivoLimpio = motivo.trim()

    if (!motivoLimpio) {
      throw new ValidationError('El motivo del bloqueo o desbloqueo es obligatorio')
    }

    return prisma.$transaction(async (tx) => {
      // 1. Actualizar bandera en el empleado
      const actualizado = await tx.empleado.update({
        where: { id: empleadoId },
        data: {
          bloqueadoParaPago: bloquear,
          motivoBloqueo: bloquear ? motivoLimpio : null
        }
      })

      // 2. Registrar en la bitácora de bloqueos
      if (bloquear) {
        await tx.bloqueoPersonal.create({
          data: {
            empleadoId,
            motivo: motivoLimpio,
            activo: true,
            creadoPorId: actor.id
          }
        })
      } else {
        // Desactivar bloqueos previos activos
        await tx.bloqueoPersonal.updateMany({
          where: { empleadoId, activo: true },
          data: {
            activo: false,
            fechaDesbloqueo: new Date(),
            motivoDesbloqueo: motivoLimpio
          }
        })
      }

      // 3. Auditoría
      await logAudit(tx, {
        userId: actor.id,
        action: bloquear ? 'BLOCK_PAYMENT' : 'UNBLOCK_PAYMENT',
        entity: 'Empleado',
        entityId: empleadoId,
        details: { motivo: motivoLimpio },
        ipAddress: ip
      })

      return actualizado
    })
  }

  /**
   * Elimina lógicamente un empleado (Soft Delete)
   */
  static async eliminar(id: number, actor: UserContext, ip?: string) {
    const actual = await this.obtenerPorId(id, actor)

    return prisma.$transaction(async (tx) => {
      const eliminado = await tx.empleado.delete({
        where: { id }
      })

      await logAudit(tx, {
        userId: actor.id,
        action: 'DELETE',
        entity: 'Empleado',
        entityId: id,
        oldValues: actual,
        ipAddress: ip
      })

      return eliminado
    })
  }
}

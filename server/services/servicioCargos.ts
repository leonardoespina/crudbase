import { prisma } from '../utils/prisma'
import { ConflictError, NotFoundError, ValidationError } from '../domain/errors'
import { logAudit } from '../utils/audit'

/**
 * Filtros para la búsqueda y paginación de cargos laborales.
 */
export interface FiltrosCargo {
  busqueda?: string
  activo?: boolean
  pagina?: number
  limite?: number
  todos?: boolean
}

/**
 * Datos requeridos para crear un cargo.
 */
export interface DatosCrearCargo {
  codigo: string
  nombre: string
  descripcion?: string
}

/**
 * Datos para actualizar un cargo.
 */
export interface DatosActualizarCargo {
  codigo?: string
  nombre?: string
  descripcion?: string
  activo?: boolean
}

/**
 * Servicio de Negocio: Gestión de Cargos
 *
 * Administra los puestos laborales que determinan la asignación en tabuladores
 * de bonificación salarial junto con el nivel jerárquico.
 */
export class ServicioCargos {
  /**
   * Obtiene la lista de cargos con soporte de paginación y búsqueda textual.
   */
  static async listar(filtros: FiltrosCargo = {}) {
    const pagina = Math.max(1, Number(filtros.pagina) || 1)
    const limite = Math.min(200, Math.max(1, Number(filtros.limite) || 50))
    const salto = (pagina - 1) * limite

    const where: any = {}

    if (filtros.activo !== undefined) {
      where.activo = filtros.activo
    }

    if (filtros.busqueda?.trim()) {
      const termino = filtros.busqueda.trim()
      where.OR = [
        { codigo: { contains: termino, mode: 'insensitive' } },
        { nombre: { contains: termino, mode: 'insensitive' } }
      ]
    }

    if (filtros.todos) {
      const items = await prisma.cargo.findMany({
        where,
        orderBy: { nombre: 'asc' }
      })
      return {
        items,
        meta: { total: items.length, page: 1, limit: items.length, totalPages: 1 }
      }
    }

    const [items, total] = await Promise.all([
      prisma.cargo.findMany({
        where,
        skip: salto,
        take: limite,
        orderBy: { nombre: 'asc' }
      }),
      prisma.cargo.count({ where })
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
   * Obtiene un cargo por su ID.
   */
  static async obtenerPorId(id: number) {
    const cargo = await prisma.cargo.findUnique({
      where: { id }
    })

    if (!cargo) {
      throw new NotFoundError('Cargo', id)
    }

    return cargo
  }

  /**
   * Registra un nuevo cargo validando unicidad de código y trazabilidad en auditoría.
   */
  static async crear(datos: DatosCrearCargo, usuarioId?: number, ip?: string) {
    const codigoLimpio = datos.codigo.trim().toUpperCase()
    const nombreLimpio = datos.nombre.trim()

    if (!codigoLimpio || !nombreLimpio) {
      throw new ValidationError('El código y el nombre del cargo son obligatorios')
    }

    const existe = await prisma.cargo.findFirst({
      where: { codigo: codigoLimpio }
    })

    if (existe) {
      throw new ConflictError(`Ya existe un cargo con el código '${codigoLimpio}'`)
    }

    return prisma.$transaction(async (tx) => {
      const nuevo = await tx.cargo.create({
        data: {
          codigo: codigoLimpio,
          nombre: nombreLimpio,
          descripcion: datos.descripcion?.trim() || null
        }
      })

      if (usuarioId) {
        await logAudit(tx, {
          userId: usuarioId,
          action: 'CREATE',
          entity: 'Cargo',
          entityId: nuevo.id,
          newValues: nuevo,
          ipAddress: ip
        })
      }

      return nuevo
    })
  }

  /**
   * Actualiza la información de un cargo.
   */
  static async actualizar(id: number, datos: DatosActualizarCargo, usuarioId?: number, ip?: string) {
    const actual = await this.obtenerPorId(id)

    const dataToUpdate: any = {}

    if (datos.codigo) {
      const codigoLimpio = datos.codigo.trim().toUpperCase()
      if (codigoLimpio !== actual.codigo) {
        const existe = await prisma.cargo.findFirst({
          where: { codigo: codigoLimpio, id: { not: id } }
        })
        if (existe) {
          throw new ConflictError(`Ya existe otro cargo con el código '${codigoLimpio}'`)
        }
        dataToUpdate.codigo = codigoLimpio
      }
    }

    if (datos.nombre) dataToUpdate.nombre = datos.nombre.trim()
    if (datos.descripcion !== undefined) dataToUpdate.descripcion = datos.descripcion?.trim() || null
    if (datos.activo !== undefined) dataToUpdate.activo = datos.activo

    return prisma.$transaction(async (tx) => {
      const actualizado = await tx.cargo.update({
        where: { id },
        data: dataToUpdate
      })

      if (usuarioId) {
        await logAudit(tx, {
          userId: usuarioId,
          action: 'UPDATE',
          entity: 'Cargo',
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
   * Elimina lógicamente un cargo (Soft Delete).
   * Impide la eliminación si existen empleados activos asociados a él.
   */
  static async eliminar(id: number, usuarioId?: number, ip?: string) {
    const actual = await this.obtenerPorId(id)

    const empleadosVinculados = await prisma.empleado.count({
      where: { cargoId: id }
    })

    if (empleadosVinculados > 0) {
      throw new ValidationError(`No se puede eliminar el cargo porque tiene ${empleadosVinculados} empleado(s) vinculado(s)`)
    }

    return prisma.$transaction(async (tx) => {
      const eliminado = await tx.cargo.delete({
        where: { id }
      })

      if (usuarioId) {
        await logAudit(tx, {
          userId: usuarioId,
          action: 'DELETE',
          entity: 'Cargo',
          entityId: id,
          oldValues: actual,
          ipAddress: ip
        })
      }

      return eliminado
    })
  }
}

import { prisma } from '../utils/prisma'
import { ConflictError, NotFoundError, ValidationError } from '../domain/errors'
import { logAudit } from '../utils/audit'

export interface FiltrosGerencia {
  busqueda?: string
  activo?: boolean
  pagina?: number
  limite?: number
  todos?: boolean
}

export interface DatosCrearGerencia {
  codigo: string
  nombre: string
  descripcion?: string
}

export interface DatosActualizarGerencia {
  codigo?: string
  nombre?: string
  descripcion?: string
  activo?: boolean
}

export class ServicioGerencias {
  /**
   * Lista gerencias con paginación estándar y búsqueda por código/nombre
   */
  static async listar(filtros: FiltrosGerencia = {}) {
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
      const items = await prisma.gerencia.findMany({
        where,
        orderBy: { nombre: 'asc' }
      })
      return {
        items,
        meta: { total: items.length, page: 1, limit: items.length, totalPages: 1 }
      }
    }

    const [items, total] = await Promise.all([
      prisma.gerencia.findMany({
        where,
        skip: salto,
        take: limite,
        orderBy: { nombre: 'asc' }
      }),
      prisma.gerencia.count({ where })
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
   * Obtiene una gerencia por su ID
   */
  static async obtenerPorId(id: number) {
    const gerencia = await prisma.gerencia.findUnique({
      where: { id }
    })

    if (!gerencia) {
      throw new NotFoundError('Gerencia', id)
    }

    return gerencia
  }

  /**
   * Crea una nueva gerencia validando código único
   */
  static async crear(datos: DatosCrearGerencia, usuarioId?: number, ip?: string) {
    const codigoLimpio = datos.codigo.trim().toUpperCase()
    const nombreLimpio = datos.nombre.trim()

    if (!codigoLimpio || !nombreLimpio) {
      throw new ValidationError('El código y el nombre de la gerencia son obligatorios')
    }

    const existe = await prisma.gerencia.findFirst({
      where: { codigo: codigoLimpio }
    })

    if (existe) {
      throw new ConflictError(`Ya existe una gerencia con el código '${codigoLimpio}'`)
    }

    return prisma.$transaction(async (tx) => {
      const nueva = await tx.gerencia.create({
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
          entity: 'Gerencia',
          entityId: nueva.id,
          newValues: nueva,
          ipAddress: ip
        })
      }

      return nueva
    })
  }

  /**
   * Actualiza los datos de una gerencia existente
   */
  static async actualizar(id: number, datos: DatosActualizarGerencia, usuarioId?: number, ip?: string) {
    const actual = await this.obtenerPorId(id)

    const dataToUpdate: any = {}

    if (datos.codigo) {
      const codigoLimpio = datos.codigo.trim().toUpperCase()
      if (codigoLimpio !== actual.codigo) {
        const existe = await prisma.gerencia.findFirst({
          where: { codigo: codigoLimpio, id: { not: id } }
        })
        if (existe) {
          throw new ConflictError(`Ya existe otra gerencia con el código '${codigoLimpio}'`)
        }
        dataToUpdate.codigo = codigoLimpio
      }
    }

    if (datos.nombre) dataToUpdate.nombre = datos.nombre.trim()
    if (datos.descripcion !== undefined) dataToUpdate.descripcion = datos.descripcion?.trim() || null
    if (datos.activo !== undefined) dataToUpdate.activo = datos.activo

    return prisma.$transaction(async (tx) => {
      const actualizada = await tx.gerencia.update({
        where: { id },
        data: dataToUpdate
      })

      if (usuarioId) {
        await logAudit(tx, {
          userId: usuarioId,
          action: 'UPDATE',
          entity: 'Gerencia',
          entityId: id,
          oldValues: actual,
          newValues: actualizada,
          ipAddress: ip
        })
      }

      return actualizada
    })
  }

  /**
   * Elimina lógicamente una gerencia (Soft Delete)
   */
  static async eliminar(id: number, usuarioId?: number, ip?: string) {
    const actual = await this.obtenerPorId(id)

    // Validar si tiene empleados activos vinculados
    const empleadosVinculados = await prisma.empleado.count({
      where: { gerenciaId: id }
    })

    if (empleadosVinculados > 0) {
      throw new ValidationError(`No se puede eliminar la gerencia porque tiene ${empleadosVinculados} empleado(s) vinculado(s)`)
    }

    return prisma.$transaction(async (tx) => {
      const eliminada = await tx.gerencia.delete({
        where: { id }
      })

      if (usuarioId) {
        await logAudit(tx, {
          userId: usuarioId,
          action: 'DELETE',
          entity: 'Gerencia',
          entityId: id,
          oldValues: actual,
          ipAddress: ip
        })
      }

      return eliminada
    })
  }
}

import { prisma } from '../utils/prisma'
import { ConflictError, NotFoundError, ValidationError } from '../domain/errors'
import { logAudit } from '../utils/audit'

export interface DatosCrearNivelSalarial {
  codigo: string
  nombre: string
  nivelJerarquico: number
}

export class ServicioNivelesSalariales {
  static async listar() {
    const items = await prisma.nivelSalarial.findMany({
      orderBy: { nivelJerarquico: 'asc' }
    })
    return {
      items,
      meta: { total: items.length, page: 1, limit: items.length, totalPages: 1 }
    }
  }

  static async crear(datos: DatosCrearNivelSalarial, usuarioId?: number, ip?: string) {
    const codigoLimpio = datos.codigo.trim().toUpperCase()
    const nombreLimpio = datos.nombre.trim()

    if (!codigoLimpio || !nombreLimpio) {
      throw new ValidationError('El código y el nombre del nivel salarial son obligatorios')
    }

    const existe = await prisma.nivelSalarial.findFirst({
      where: { codigo: codigoLimpio }
    })

    if (existe) {
      throw new ConflictError(`Ya existe un nivel salarial con el código '${codigoLimpio}'`)
    }

    return prisma.$transaction(async (tx) => {
      const nuevo = await tx.nivelSalarial.create({
        data: {
          codigo: codigoLimpio,
          nombre: nombreLimpio,
          nivelJerarquico: Number(datos.nivelJerarquico) || 1
        }
      })

      if (usuarioId) {
        await logAudit(tx, {
          userId: usuarioId,
          action: 'CREATE',
          entity: 'NivelSalarial',
          entityId: nuevo.id,
          newValues: nuevo,
          ipAddress: ip
        })
      }

      return nuevo
    })
  }
}

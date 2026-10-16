import { prisma } from '../utils/prisma'
import { ConflictError, NotFoundError, ValidationError } from '../domain/errors'
import { logAudit } from '../utils/audit'
import type { UserContext } from '../utils/auth'

/**
 * Parámetros de consulta y filtrado para el listado de empleados.
 */
export interface FiltrosEmpleado {
  /** Término de búsqueda textual por cédula, nombres o apellidos */
  busqueda?: string
  /** Identificador de la sede operativa para filtrar registros */
  sedeId?: number
  /** Identificador de la gerencia o departamento organizacional */
  gerenciaId?: number
  /** Identificador del cargo o puesto laboral */
  cargoId?: number
  /** Filtro por estatus de bloqueo preventivo de pagos en taquilla */
  bloqueadoParaPago?: boolean
  /** Filtro por estatus de actividad del empleado (activo/inactivo) */
  activo?: boolean
  /** Número de página actual para paginación server-side (base 1) */
  pagina?: number
  /** Cantidad máxima de registros por página (máx. 200) */
  limite?: number
  /** Bandera para obtener la totalidad de registros sin paginar */
  todos?: boolean
}

/**
 * Estructura de datos requerida para el registro de un nuevo empleado.
 */
export interface DatosCrearEmpleado {
  /** Cédula de identidad oficial (debe ser única en el sistema) */
  cedula: string
  /** Nombres de pila del trabajador */
  nombres: string
  /** Apellidos del trabajador */
  apellidos: string
  /** Correo electrónico de contacto (opcional) */
  correo?: string
  /** Número de teléfono móvil o local (opcional) */
  telefono?: string
  /** ID de la sede operativa a la que pertenece el trabajador */
  sedeId: number
  /** ID de la gerencia donde labora */
  gerenciaId: number
  /** ID del cargo asignado */
  cargoId: number
  /** ID del nivel salarial asignado en el tabulador (opcional) */
  nivelSalarialId?: number
}

/**
 * Estructura de datos para la actualización de un empleado existente.
 */
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

/**
 * Servicio de Negocio: Gestión de Personal y Empleados
 *
 * Responsabilidades:
 * - Registro y administración del maestro de trabajadores.
 * - Aplicación estricta de aislamiento multisede según el rol del usuario autenticado.
 * - Bloqueo preventivo de pagos (equivalente al formulario frmGpersonalComp del sistema legacy).
 * - Trazabilidad inalterable de auditoría en todas las operaciones de escritura.
 */
export class ServicioEmpleados {
  /**
   * Obtiene un listado paginado de empleados aplicando filtros cruzados y aislamiento multisede.
   *
   * @param filtros Criterios de búsqueda y paginación
   * @param actor Contexto del usuario autenticado para aplicar filtros de sede
   * @returns Objeto con items paginados y metadatos ({ total, page, limit, totalPages })
   */
  static async listar(filtros: FiltrosEmpleado = {}, actor?: UserContext) {
    const pagina = Math.max(1, Number(filtros.pagina) || 1)
    const limite = Math.min(200, Math.max(1, Number(filtros.limite) || 50))
    const salto = (pagina - 1) * limite

    const where: any = {}

    // Regla de Seguridad Multisede:
    // Si el usuario no tiene rol ADMIN, se fuerza el filtro a su sede asignada.
    // NUNCA se confía en el parámetro sedeId enviado por el cliente si el actor no es ADMIN.
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

    // Búsqueda insensible a mayúsculas/minúsculas en cédula, nombres o apellidos
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

    // Caso de uso para combos y catálogos en frontend (retorna todos ordenados alfabéticamente)
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

    // Consulta en paralelo de registros paginados y conteo total para la tabla
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
   * Consulta el detalle completo de un empleado por su identificador primario.
   *
   * @param id Identificador numérico del empleado
   * @param actor Contexto del usuario autenticado para validar permisos de sede
   * @throws NotFoundError Si el empleado no existe o pertenece a otra sede no autorizada
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

    // Validación de aislamiento multisede: los operadores solo pueden ver personal de su sede
    if (actor && !actor.isAdmin && actor.branchId && empleado.sedeId !== actor.branchId) {
      throw new NotFoundError('Empleado', id)
    }

    return empleado
  }

  /**
   * Localiza un empleado mediante su Cédula de Identidad oficial.
   * Útil para búsquedas rápidas en taquilla de caja y carga de personal.
   *
   * @param cedula Cédula del trabajador (ej: "V-12345678")
   * @param actor Contexto de usuario autenticado
   * @throws NotFoundError Si la cédula no está registrada
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
   * Registra un nuevo empleado de forma atómica en la base de datos con bitácora de auditoría.
   *
   * @param datos Datos obligatorios y complementarios del empleado
   * @param actor Contexto del usuario que ejecuta la acción
   * @param ip Dirección IP de la solicitud HTTP para auditoría
   * @throws ValidationError Si faltan campos requeridos o las relaciones no existen
   * @throws ConflictError Si la cédula ya se encuentra registrada en el sistema
   */
  static async crear(datos: DatosCrearEmpleado, actor?: UserContext, ip?: string) {
    const cedulaLimpia = datos.cedula.trim().toUpperCase()
    const nombresLimpios = datos.nombres.trim()
    const apellidosLimpios = datos.apellidos.trim()

    if (!cedulaLimpia || !nombresLimpios || !apellidosLimpios) {
      throw new ValidationError('Cédula, nombres y apellidos son campos obligatorios')
    }

    // Si el actor es operador local, se fuerza a registrar al empleado en su sede
    let sedeFinalId = datos.sedeId
    if (actor && !actor.isAdmin && actor.branchId) {
      sedeFinalId = actor.branchId
    }

    // Regla de unicidad de cédula
    const existe = await prisma.empleado.findUnique({
      where: { cedula: cedulaLimpia }
    })
    if (existe) {
      throw new ConflictError(`Ya existe un empleado registrado con la cédula '${cedulaLimpia}'`)
    }

    // Verificación de integridad referencial antes de insertar
    const [sedeExiste, gerenciaExiste, cargoExiste] = await Promise.all([
      prisma.branch.findUnique({ where: { id: sedeFinalId } }),
      prisma.gerencia.findUnique({ where: { id: datos.gerenciaId } }),
      prisma.cargo.findUnique({ where: { id: datos.cargoId } })
    ])

    if (!sedeExiste) throw new ValidationError('La sede especificada no existe')
    if (!gerenciaExiste) throw new ValidationError('La gerencia especificada no existe')
    if (!cargoExiste) throw new ValidationError('El cargo especificado no existe')

    // Inserción atómica con transacción y registro de auditoría
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
   * Actualiza los datos personales o laborales de un empleado.
   *
   * @param id Identificador del empleado
   * @param datos Campos a modificar
   * @param actor Contexto del usuario autenticado
   * @param ip Dirección IP para auditoría
   */
  static async actualizar(id: number, datos: DatosActualizarEmpleado, actor?: UserContext, ip?: string) {
    const actual = await this.obtenerPorId(id, actor)

    const dataToUpdate: any = {}

    // Si cambia de cédula, validar que no choque con otro registro
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

    // Regla de seguridad: Solo el Super Administrador puede reasignar un empleado a otra sede
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
   * Bloqueo o Desbloqueo Preventivo de Pagos (frmGpersonalComp / t_personal_pagos)
   *
   * Regla de Negocio:
   * Cuando Talento Humano o la Gerencia detecta irregularidades, reposos médicos pendientes
   * o falta de entrega de recaudos, puede suspender preventivamente el pago en taquilla
   * a un trabajador indicando un motivo formal. La caja rechazará el desembolso hasta
   * que se levante esta restricción.
   *
   * @param empleadoId Identificador del empleado
   * @param bloquear `true` para bloquear pagos, `false` para desbloquear
   * @param motivo Justificación obligatoria del bloqueo o desbloqueo
   * @param actor Usuario que autoriza la medida
   * @param ip Dirección IP del operador
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
      // 1. Actualizar bandera booleana y motivo en la ficha del empleado
      const actualizado = await tx.empleado.update({
        where: { id: empleadoId },
        data: {
          bloqueadoParaPago: bloquear,
          motivoBloqueo: bloquear ? motivoLimpio : null
        }
      })

      // 2. Registrar en la bitácora histórica de bloqueos de personal
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
        // Al desbloquear, se cierran los registros de bloqueo activos previos
        await tx.bloqueoPersonal.updateMany({
          where: { empleadoId, activo: true },
          data: {
            activo: false,
            fechaDesbloqueo: new Date(),
            motivoDesbloqueo: motivoLimpio
          }
        })
      }

      // 3. Auditoría inalterable del evento de seguridad
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
   * Elimina lógicamente un empleado mediante Soft Delete (marca `deletedAt`).
   * No se destruye el registro histórico para mantener la trazabilidad de pagos pasados.
   *
   * @param id Identificador del empleado
   * @param actor Usuario autenticado
   * @param ip Dirección IP
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

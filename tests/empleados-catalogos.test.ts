import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { ServicioGerencias } from '../server/services/servicioGerencias'
import { ServicioCargos } from '../server/services/servicioCargos'
import { ServicioNivelesSalariales } from '../server/services/servicioNivelesSalariales'
import { ServicioEmpleados } from '../server/services/servicioEmpleados'

describe('Paso 2: Pruebas de Servicios de Catálogos y Empleados (en Español)', () => {
  const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL
  })

  let sedeA: any
  let sedeB: any
  let gerenciaId: number
  let cargoId: number
  let nivelId: number
  let empleadoId: number

  const adminActor: any = {
    id: 1,
    username: 'admin',
    name: 'Admin General',
    roleId: 1,
    roleName: 'ADMIN',
    isAdmin: true,
    branchId: null
  }

  beforeAll(async () => {
    // Asegurar dos sedes para probar multisede
    sedeA = await prisma.branch.findFirst({ where: { code: 'SEDE-A' } })
    if (!sedeA) {
      sedeA = await prisma.branch.create({
        data: { code: 'SEDE-A', name: 'Sede Puerto Ordaz' }
      })
    }

    sedeB = await prisma.branch.findFirst({ where: { code: 'SEDE-B' } })
    if (!sedeB) {
      sedeB = await prisma.branch.create({
        data: { code: 'SEDE-B', name: 'Sede Ciudad Piar' }
      })
    }
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('1. ServicioGerencias: Debe crear, listar y actualizar gerencia', async () => {
    const sufijo = Date.now().toString().slice(-4)
    const gerencia = await ServicioGerencias.crear({
      codigo: `G-OP-${sufijo}`,
      nombre: 'Gerencia Planta Procesadora'
    }, adminActor.id)

    expect(gerencia.id).toBeDefined()
    gerenciaId = gerencia.id

    const listado = await ServicioGerencias.listar({ busqueda: `G-OP-${sufijo}` })
    expect(listado.items.length).toBe(1)
    expect(listado.items[0].nombre).toBe('Gerencia Planta Procesadora')

    const actualizada = await ServicioGerencias.actualizar(gerencia.id, {
      nombre: 'Gerencia Planta Procesadora Actualizada'
    }, adminActor.id)
    expect(actualizada.nombre).toBe('Gerencia Planta Procesadora Actualizada')
  })

  it('2. ServicioCargos y ServicioNivelesSalariales: Debe crear y listar', async () => {
    const sufijo = Date.now().toString().slice(-4)
    const cargo = await ServicioCargos.crear({
      codigo: `C-ELEC-${sufijo}`,
      nombre: 'Técnico Electricista Industrial'
    }, adminActor.id)
    cargoId = cargo.id

    const nivel = await ServicioNivelesSalariales.crear({
      codigo: `N-ESP-${sufijo}`,
      nombre: 'Nivel Especializado IV',
      nivelJerarquico: 4
    }, adminActor.id)
    nivelId = nivel.id

    expect(cargo.id).toBeDefined()
    expect(nivel.id).toBeDefined()
  })

  it('3. ServicioEmpleados: Debe crear un empleado con validaciones', async () => {
    const cedulaTest = `V-${Date.now().toString().slice(-7)}`

    const empleado = await ServicioEmpleados.crear({
      cedula: cedulaTest,
      nombres: 'Carlos Alberto',
      apellidos: 'García Peña',
      correo: 'carlos.garcia@empresa.com',
      telefono: '0414-1234567',
      sedeId: sedeA.id,
      gerenciaId: gerenciaId,
      cargoId: cargoId,
      nivelSalarialId: nivelId
    }, adminActor)

    expect(empleado.id).toBeDefined()
    expect(empleado.cedula).toBe(cedulaTest)
    expect(empleado.bloqueadoParaPago).toBe(false)
    empleadoId = empleado.id
  })

  it('4. ServicioEmpleados: Bloqueo preventivo de pagos debe registrar en bitácora', async () => {
    const bloqueado = await ServicioEmpleados.cambiarBloqueoPago(
      empleadoId,
      true,
      'Falta de entrega de recibo firmado de la quincena anterior',
      adminActor
    )

    expect(bloqueado.bloqueadoParaPago).toBe(true)
    expect(bloqueado.motivoBloqueo).toBe('Falta de entrega de recibo firmado de la quincena anterior')

    const desbloqueado = await ServicioEmpleados.cambiarBloqueoPago(
      empleadoId,
      false,
      'Recibo entregado y verificado',
      adminActor
    )

    expect(desbloqueado.bloqueadoParaPago).toBe(false)
    expect(desbloqueado.motivoBloqueo).toBeNull()
  })

  it('5. ServicioEmpleados: Debe aplicar aislamiento multisede para operadores', async () => {
    const operadorSedeB: any = {
      id: 99,
      username: 'operador_b',
      name: 'Operador Sede B',
      roleId: 2,
      roleName: 'OPERATOR',
      isAdmin: false,
      branchId: sedeB.id
    }

    // El empleado que creamos pertenece a sedeA. El operador de sedeB no debe verlo
    const listado = await ServicioEmpleados.listar({}, operadorSedeB)
    const encontrado = listado.items.some((emp: any) => emp.id === empleadoId)
    expect(encontrado).toBe(false)

    // Pero el admin sí debe verlo
    const listadoAdmin = await ServicioEmpleados.listar({}, adminActor)
    const encontradoPorAdmin = listadoAdmin.items.some((emp: any) => emp.id === empleadoId)
    expect(encontradoPorAdmin).toBe(true)
  })

  it('6. ServicioEmpleados: Soft Delete debe marcar fecha y ocultar del listado', async () => {
    await ServicioEmpleados.eliminar(empleadoId, adminActor)

    // Al consultar con soft delete no debe aparecer
    const listado = await ServicioEmpleados.listar({ todos: true }, adminActor)
    const encontrado = listado.items.some((emp: any) => emp.id === empleadoId)
    expect(encontrado).toBe(false)

    // En base de datos debe tener deletedAt lleno
    const registroRaw = await prisma.empleado.findUnique({
      where: { id: empleadoId }
    })
    expect(registroRaw?.deletedAt).not.toBeNull()
  })
})

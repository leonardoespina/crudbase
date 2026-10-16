import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'

describe('Paso 1: Validación del Esquema de Datos y Modelos en Español', () => {
  const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL
  })

  let sedePruebaId: number
  let gerenciaPruebaId: number
  let cargoPruebaId: number
  let nivelPruebaId: number

  beforeAll(async () => {
    // Buscar o crear sede base para las pruebas
    let sede = await prisma.branch.findFirst({ where: { deletedAt: null } })
    if (!sede) {
      sede = await prisma.branch.create({
        data: { code: 'TEST-SEDE', name: 'Sede Pruebas' }
      })
    }
    sedePruebaId = sede.id
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('1. Debe crear y consultar Gerencia, Cargo y Nivel Salarial en español', async () => {
    const sufijo = Date.now().toString().slice(-4)

    const gerencia = await prisma.gerencia.create({
      data: {
        codigo: `GER-${sufijo}`,
        nombre: 'Gerencia de Operaciones Mina'
      }
    })
    gerenciaPruebaId = gerencia.id

    const cargo = await prisma.cargo.create({
      data: {
        codigo: `CARG-${sufijo}`,
        nombre: 'Operador de Camión 777'
      }
    })
    cargoPruebaId = cargo.id

    const nivel = await prisma.nivelSalarial.create({
      data: {
        codigo: `NIV-${sufijo}`,
        nombre: 'Nivel Superior III',
        nivelJerarquico: 3
      }
    })
    nivelPruebaId = nivel.id

    expect(gerencia.id).toBeDefined()
    expect(cargo.id).toBeDefined()
    expect(nivel.id).toBeDefined()
    expect(gerencia.codigo).toBe(`GER-${sufijo}`)
  })

  it('2. Debe crear un Empleado con relaciones válidas y campos en español', async () => {
    const cedulaTest = `V-${Date.now().toString().slice(-7)}`

    const empleado = await prisma.empleado.create({
      data: {
        cedula: cedulaTest,
        nombres: 'José Gregorio',
        apellidos: 'Hernández',
        sedeId: sedePruebaId,
        gerenciaId: gerenciaPruebaId,
        cargoId: cargoPruebaId,
        nivelSalarialId: nivelPruebaId,
        bloqueadoParaPago: false
      },
      include: {
        gerencia: true,
        cargo: true,
        sede: true
      }
    })

    expect(empleado.id).toBeDefined()
    expect(empleado.cedula).toBe(cedulaTest)
    expect(empleado.gerencia.nombre).toBe('Gerencia de Operaciones Mina')
    expect(empleado.cargo.nombre).toBe('Operador de Camión 777')
    expect(empleado.sede.id).toBe(sedePruebaId)
  })

  it('3. Debe manejar ConceptoBono y TabuladorBono con tipo Decimal estricto', async () => {
    const sufijo = Date.now().toString().slice(-4)

    const concepto = await prisma.conceptoBono.create({
      data: {
        codigo: `BONO-PROD-${sufijo}`,
        nombre: 'Bono de Productividad Quincenal',
        montoBasePredeterminado: '150.50'
      }
    })

    const tabulador = await prisma.tabuladorBono.create({
      data: {
        conceptoBonoId: concepto.id,
        cargoId: cargoPruebaId,
        nivelSalarialId: nivelPruebaId,
        montoBono: '175.75',
        porcentajeAjuste: '10.00'
      }
    })

    expect(concepto.montoBasePredeterminado.toNumber()).toBe(150.50)
    expect(tabulador.montoBono.toNumber()).toBe(175.75)
    expect(tabulador.porcentajeAjuste.toNumber()).toBe(10.00)
  })

  it('4. Debe verificar la unicidad de cédula en empleados', async () => {
    const cedulaDuplicada = `V-DUP-${Date.now().toString().slice(-5)}`

    await prisma.empleado.create({
      data: {
        cedula: cedulaDuplicada,
        nombres: 'Primero',
        apellidos: 'Duplicado',
        sedeId: sedePruebaId,
        gerenciaId: gerenciaPruebaId,
        cargoId: cargoPruebaId
      }
    })

    await expect(
      prisma.empleado.create({
        data: {
          cedula: cedulaDuplicada,
          nombres: 'Segundo',
          apellidos: 'Duplicado',
          sedeId: sedePruebaId,
          gerenciaId: gerenciaPruebaId,
          cargoId: cargoPruebaId
        }
      })
    ).rejects.toThrow()
  })
})

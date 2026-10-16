import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Empleado {
  id: number
  cedula: string
  nombres: string
  apellidos: string
  correo?: string | null
  telefono?: string | null
  sedeId: number
  gerenciaId: number
  cargoId: number
  nivelSalarialId?: number | null
  activo: boolean
  bloqueadoParaPago: boolean
  motivoBloqueo?: string | null
  sede?: { id: number; code: string; name: string }
  gerencia?: { id: number; codigo: string; nombre: string }
  cargo?: { id: number; codigo: string; nombre: string }
  nivelSalarial?: { id: number; codigo: string; nombre: string } | null
}

export const useEmpleadosStore = defineStore('empleados', () => {
  const empleados = ref<Empleado[]>([])
  const gerencias = ref<any[]>([])
  const cargos = ref<any[]>([])
  const nivelesSalariales = ref<any[]>([])
  const sedes = ref<any[]>([])
  const loading = ref(false)
  const total = ref(0)
  const page = ref(1)
  const limit = ref(20)

  async function fetchCatalogos() {
    try {
      const [resGerencias, resCargos, resNiveles, resSedes]: any[] = await Promise.all([
        $fetch('/api/gerencias?todos=true'),
        $fetch('/api/cargos?todos=true'),
        $fetch('/api/niveles-salariales'),
        $fetch('/api/branches')
      ])

      gerencias.value = resGerencias?.items || []
      cargos.value = resCargos?.items || []
      nivelesSalariales.value = resNiveles?.items || []
      sedes.value = resSedes?.items || resSedes || []
    } catch (error) {
      console.error('Error cargando catálogos de empleados:', error)
    }
  }

  async function fetchEmpleados(filtros: any = {}) {
    loading.value = true
    try {
      const params = new URLSearchParams()
      if (filtros.busqueda) params.append('busqueda', filtros.busqueda)
      if (filtros.gerenciaId) params.append('gerenciaId', filtros.gerenciaId.toString())
      if (filtros.cargoId) params.append('cargoId', filtros.cargoId.toString())
      if (filtros.sedeId) params.append('sedeId', filtros.sedeId.toString())
      if (filtros.bloqueadoParaPago !== undefined && filtros.bloqueadoParaPago !== null) {
        params.append('bloqueadoParaPago', filtros.bloqueadoParaPago.toString())
      }
      params.append('page', (filtros.page || page.value).toString())
      params.append('limit', (filtros.limit || limit.value).toString())

      const res: any = await $fetch(`/api/empleados?${params.toString()}`)
      empleados.value = res.items || []
      total.value = res.meta?.total || 0
      page.value = res.meta?.page || 1
      limit.value = res.meta?.limit || 20
    } finally {
      loading.value = false
    }
  }

  async function crearEmpleado(datos: any) {
    const nuevo = await $fetch('/api/empleados', {
      method: 'POST',
      body: datos
    })
    await fetchEmpleados()
    return nuevo
  }

  async function actualizarEmpleado(id: number, datos: any) {
    const actualizado = await $fetch(`/api/empleados/${id}`, {
      method: 'PUT',
      body: datos
    })
    await fetchEmpleados()
    return actualizado
  }

  async function cambiarBloqueo(id: number, bloquear: boolean, motivo: string) {
    const res = await $fetch(`/api/empleados/${id}/bloqueo`, {
      method: 'PUT',
      body: { bloquear, motivo }
    })
    await fetchEmpleados()
    return res
  }

  async function eliminarEmpleado(id: number) {
    await $fetch(`/api/empleados/${id}`, {
      method: 'DELETE'
    })
    await fetchEmpleados()
  }

  return {
    empleados,
    gerencias,
    cargos,
    nivelesSalariales,
    sedes,
    loading,
    total,
    page,
    limit,
    fetchCatalogos,
    fetchEmpleados,
    crearEmpleado,
    actualizarEmpleado,
    cambiarBloqueo,
    eliminarEmpleado
  }
})

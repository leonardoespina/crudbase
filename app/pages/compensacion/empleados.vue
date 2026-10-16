<template>
  <q-page padding>
    <!-- Cabecera de la Página -->
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-h4 text-weight-bold text-primary">Gestión de Personal y Empleados</div>
        <div class="text-caption text-grey-7">Maestro de trabajadores, asignación de cargos, gerencias y bloqueo preventivo de pagos</div>
      </div>
      <q-btn
        color="primary"
        icon="person_add"
        label="Nuevo Empleado"
        unelevated
        @click="abrirDialogoCrear"
      />
    </div>

    <!-- Barra de Filtros -->
    <q-card flat bordered class="q-pa-md q-mb-md">
      <div class="row q-col-gutter-sm items-center">
        <div class="col-12 col-sm-4">
          <q-input
            v-model="filtros.busqueda"
            placeholder="Buscar por cédula, nombre o apellido..."
            outlined
            dense
            clearable
            @update:model-value="buscarConDebounce"
          >
            <template v-slot:prepend>
              <q-icon name="search" />
            </template>
          </q-input>
        </div>

        <div class="col-12 col-sm-3">
          <q-select
            v-model="filtros.gerenciaId"
            :options="store.gerencias"
            option-label="nombre"
            option-value="id"
            emit-value
            map-options
            label="Gerencia"
            outlined
            dense
            clearable
            @update:model-value="cargarEmpleados"
          />
        </div>

        <div class="col-12 col-sm-3">
          <q-select
            v-model="filtros.cargoId"
            :options="store.cargos"
            option-label="nombre"
            option-value="id"
            emit-value
            map-options
            label="Cargo"
            outlined
            dense
            clearable
            @update:model-value="cargarEmpleados"
          />
        </div>

        <div class="col-12 col-sm-2">
          <q-select
            v-model="filtros.bloqueadoParaPago"
            :options="opcionesEstadoPago"
            emit-value
            map-options
            label="Estado Pago"
            outlined
            dense
            clearable
            @update:model-value="cargarEmpleados"
          />
        </div>
      </div>
    </q-card>

    <!-- Tabla Principal de Empleados -->
    <SharedCrudTable
      title="Nómina de Trabajadores"
      :rows="store.empleados"
      :columns="columnas"
      :loading="store.loading"
      :pagination="paginacion"
      @request="onTableRequest"
    >
      <!-- Slot de Cédula con estilo destacado -->
      <template #body-cell-cedula="props">
        <q-td :props="props">
          <span class="text-weight-bold text-primary font-mono">{{ props.row.cedula }}</span>
        </q-td>
      </template>

      <!-- Slot de Estado de Pago -->
      <template #body-cell-bloqueadoParaPago="props">
        <q-td :props="props">
          <q-chip
            v-if="props.row.bloqueadoParaPago"
            color="negative"
            text-color="white"
            icon="block"
            size="sm"
            class="text-weight-bold"
          >
            Bloqueado
            <q-tooltip v-if="props.row.motivoBloqueo">
              Motivo: {{ props.row.motivoBloqueo }}
            </q-tooltip>
          </q-chip>
          <q-chip
            v-else
            color="positive"
            text-color="white"
            icon="check_circle"
            size="sm"
          >
            Activo
          </q-chip>
        </q-td>
      </template>

      <!-- Slot de Acciones -->
      <template #body-cell-actions="props">
        <q-td :props="props" class="q-gutter-xs">
          <!-- Botón Bloquear / Desbloquear Pago (Reemplazo frmGpersonalComp) -->
          <q-btn
            flat
            round
            dense
            :icon="props.row.bloqueadoParaPago ? 'lock_open' : 'lock'"
            :color="props.row.bloqueadoParaPago ? 'positive' : 'warning'"
            @click="abrirDialogoBloqueo(props.row)"
          >
            <q-tooltip>
              {{ props.row.bloqueadoParaPago ? 'Desbloquear pago' : 'Bloqueo preventivo de pago' }}
            </q-tooltip>
          </q-btn>

          <!-- Editar -->
          <q-btn
            flat
            round
            dense
            icon="edit"
            color="primary"
            @click="abrirDialogoEditar(props.row)"
          >
            <q-tooltip>Editar empleado</q-tooltip>
          </q-btn>

          <!-- Eliminar -->
          <q-btn
            flat
            round
            dense
            icon="delete"
            color="negative"
            @click="confirmarEliminar(props.row)"
          >
            <q-tooltip>Eliminar empleado</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </SharedCrudTable>

    <!-- Modal Formulario Crear / Editar Empleado -->
    <SharedFormDialog
      v-model="dialogoFormulario"
      :title="modoEdicion ? 'Editar Empleado' : 'Nuevo Empleado'"
      :loading="guardando"
      @submit="guardarEmpleado"
    >
      <div class="row q-col-gutter-md">
        <div class="col-12 col-sm-4">
          <q-input
            v-model="formulario.cedula"
            label="Cédula de Identidad *"
            outlined
            dense
            hint="Ej: V-12345678"
            :rules="[val => !!val || 'Requerido']"
          />
        </div>
        <div class="col-12 col-sm-4">
          <q-input
            v-model="formulario.nombres"
            label="Nombres *"
            outlined
            dense
            :rules="[val => !!val || 'Requerido']"
          />
        </div>
        <div class="col-12 col-sm-4">
          <q-input
            v-model="formulario.apellidos"
            label="Apellidos *"
            outlined
            dense
            :rules="[val => !!val || 'Requerido']"
          />
        </div>

        <div class="col-12 col-sm-6">
          <q-select
            v-model="formulario.sedeId"
            :options="store.sedes"
            option-label="name"
            option-value="id"
            emit-value
            map-options
            label="Sede Operativa *"
            outlined
            dense
            :rules="[val => !!val || 'Requerido']"
          />
        </div>

        <div class="col-12 col-sm-6">
          <q-select
            v-model="formulario.gerenciaId"
            :options="store.gerencias"
            option-label="nombre"
            option-value="id"
            emit-value
            map-options
            label="Gerencia / Departamento *"
            outlined
            dense
            :rules="[val => !!val || 'Requerido']"
          />
        </div>

        <div class="col-12 col-sm-6">
          <q-select
            v-model="formulario.cargoId"
            :options="store.cargos"
            option-label="nombre"
            option-value="id"
            emit-value
            map-options
            label="Cargo *"
            outlined
            dense
            :rules="[val => !!val || 'Requerido']"
          />
        </div>

        <div class="col-12 col-sm-6">
          <q-select
            v-model="formulario.nivelSalarialId"
            :options="store.nivelesSalariales"
            option-label="nombre"
            option-value="id"
            emit-value
            map-options
            label="Nivel Salarial"
            outlined
            dense
            clearable
          />
        </div>

        <div class="col-12 col-sm-6">
          <q-input
            v-model="formulario.correo"
            label="Correo Electrónico"
            type="email"
            outlined
            dense
          />
        </div>

        <div class="col-12 col-sm-6">
          <q-input
            v-model="formulario.telefono"
            label="Teléfono"
            outlined
            dense
          />
        </div>
      </div>
    </SharedFormDialog>

    <!-- Modal de Bloqueo Preventivo de Pagos -->
    <q-dialog v-model="dialogoBloqueo" persistent>
      <q-card style="min-width: 450px">
        <q-card-section :class="empleadoSeleccionado?.bloqueadoParaPago ? 'bg-positive text-white' : 'bg-warning text-dark'">
          <div class="text-subtitle1 text-weight-bold">
            {{ empleadoSeleccionado?.bloqueadoParaPago ? 'Desbloquear Pago' : 'Bloqueo Preventivo de Pago' }}
          </div>
          <div class="text-caption">
            Trabajador: {{ empleadoSeleccionado?.nombres }} {{ empleadoSeleccionado?.apellidos }} ({{ empleadoSeleccionado?.cedula }})
          </div>
        </q-card-section>

        <q-card-section class="q-pa-md">
          <div class="text-caption text-grey-8 q-mb-sm">
            {{ empleadoSeleccionado?.bloqueadoParaPago
              ? 'Indica la justificación del levantamiento de la restricción de pago:'
              : 'Al bloquear al trabajador, la taquilla de caja impedirá procesar cualquier desembolso de bonos:'
            }}
          </div>
          <q-input
            v-model="motivoBloqueo"
            label="Motivo / Justificación *"
            type="textarea"
            rows="3"
            outlined
            dense
            autofocus
            :rules="[val => (val && val.length >= 3) || 'Mínimo 3 caracteres']"
          />
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md bg-grey-1">
          <q-btn flat label="Cancelar" color="grey-8" v-close-popup :disable="guardandoBloqueo" />
          <q-btn
            unelevated
            :label="empleadoSeleccionado?.bloqueadoParaPago ? 'Confirmar Desbloqueo' : 'Confirmar Bloqueo'"
            :color="empleadoSeleccionado?.bloqueadoParaPago ? 'positive' : 'negative'"
            :loading="guardandoBloqueo"
            @click="ejecutarCambioBloqueo"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useEmpleadosStore, type Empleado } from '../../stores/empleados'
import { useNotifications } from '../../composables/core/useNotifications'
import { useDialog } from 'quasar'

const store = useEmpleadosStore()
const notify = useNotifications()

const filtros = reactive({
  busqueda: '',
  gerenciaId: null as number | null,
  cargoId: null as number | null,
  bloqueadoParaPago: null as boolean | null
})

const paginacion = ref({
  page: 1,
  rowsPerPage: 20,
  rowsNumber: 0
})

const opcionesEstadoPago = [
  { label: 'Todos', value: null },
  { label: 'Activo para pago', value: false },
  { label: 'Bloqueado', value: true }
]

const columnas: any[] = [
  { name: 'cedula', label: 'Cédula', field: 'cedula', align: 'left', sortable: true },
  { name: 'nombre', label: 'Trabajador', field: (row: Empleado) => `${row.apellidos}, ${row.nombres}`, align: 'left', sortable: true },
  { name: 'cargo', label: 'Cargo', field: (row: Empleado) => row.cargo?.nombre || '—', align: 'left' },
  { name: 'gerencia', label: 'Gerencia', field: (row: Empleado) => row.gerencia?.nombre || '—', align: 'left' },
  { name: 'sede', label: 'Sede', field: (row: Empleado) => row.sede?.name || '—', align: 'left' },
  { name: 'bloqueadoParaPago', label: 'Estatus Pago', field: 'bloqueadoParaPago', align: 'center' },
  { name: 'actions', label: 'Acciones', align: 'right' }
]

const dialogoFormulario = ref(false)
const modoEdicion = ref(false)
const guardando = ref(false)
const empleadoIdEditando = ref<number | null>(null)

const formulario = reactive({
  cedula: '',
  nombres: '',
  apellidos: '',
  correo: '',
  telefono: '',
  sedeId: null as number | null,
  gerenciaId: null as number | null,
  cargoId: null as number | null,
  nivelSalarialId: null as number | null
})

// Variables para Bloqueo Preventivo
const dialogoBloqueo = ref(false)
const guardandoBloqueo = ref(false)
const empleadoSeleccionado = ref<Empleado | null>(null)
const motivoBloqueo = ref('')

let timeoutBusqueda: any = null
const buscarConDebounce = () => {
  clearTimeout(timeoutBusqueda)
  timeoutBusqueda = setTimeout(() => {
    cargarEmpleados()
  }, 350)
}

const cargarEmpleados = async () => {
  await store.fetchEmpleados({
    busqueda: filtros.busqueda,
    gerenciaId: filtros.gerenciaId,
    cargoId: filtros.cargoId,
    bloqueadoParaPago: filtros.bloqueadoParaPago,
    page: paginacion.value.page,
    limit: paginacion.value.rowsPerPage
  })
  paginacion.value.rowsNumber = store.total
}

const onTableRequest = (props: any) => {
  paginacion.value.page = props.pagination.page
  paginacion.value.rowsPerPage = props.pagination.rowsPerPage
  cargarEmpleados()
}

onMounted(async () => {
  await Promise.all([
    store.fetchCatalogos(),
    cargarEmpleados()
  ])
})

const abrirDialogoCrear = () => {
  modoEdicion.value = false
  empleadoIdEditando.value = null
  Object.assign(formulario, {
    cedula: '',
    nombres: '',
    apellidos: '',
    correo: '',
    telefono: '',
    sedeId: store.sedes[0]?.id || null,
    gerenciaId: null,
    cargoId: null,
    nivelSalarialId: null
  })
  dialogoFormulario.value = true
}

const abrirDialogoEditar = (emp: Empleado) => {
  modoEdicion.value = true
  empleadoIdEditando.value = emp.id
  Object.assign(formulario, {
    cedula: emp.cedula,
    nombres: emp.nombres,
    apellidos: emp.apellidos,
    correo: emp.correo || '',
    telefono: emp.telefono || '',
    sedeId: emp.sedeId,
    gerenciaId: emp.gerenciaId,
    cargoId: emp.cargoId,
    nivelSalarialId: emp.nivelSalarialId
  })
  dialogoFormulario.value = true
}

const guardarEmpleado = async () => {
  guardando.value = true
  try {
    if (modoEdicion.value && empleadoIdEditando.value) {
      await store.actualizarEmpleado(empleadoIdEditando.value, formulario)
      notify.success('Empleado actualizado exitosamente')
    } else {
      await store.crearEmpleado(formulario)
      notify.success('Empleado registrado exitosamente')
    }
    dialogoFormulario.value = false
  } catch (err: any) {
    notify.error(err.data?.message || 'Error al guardar empleado')
  } finally {
    guardando.value = false
  }
}

const abrirDialogoBloqueo = (emp: Empleado) => {
  empleadoSeleccionado.value = emp
  motivoBloqueo.value = emp.motivoBloqueo || ''
  dialogoBloqueo.value = true
}

const ejecutarCambioBloqueo = async () => {
  if (!empleadoSeleccionado.value || !motivoBloqueo.value.trim()) return

  guardandoBloqueo.value = true
  try {
    const nuevoEstado = !empleadoSeleccionado.value.bloqueadoParaPago
    await store.cambiarBloqueo(empleadoSeleccionado.value.id, nuevoEstado, motivoBloqueo.value)
    notify.success(nuevoEstado ? 'Pago bloqueado preventivamente' : 'Pago desbloqueado exitosamente')
    dialogoBloqueo.value = false
  } catch (err: any) {
    notify.error(err.data?.message || 'Error al cambiar bloqueo')
  } finally {
    guardandoBloqueo.value = false
  }
}

const confirmarEliminar = (emp: Empleado) => {
  if (confirm(`¿Estás seguro de eliminar al empleado ${emp.nombres} ${emp.apellidos} (${emp.cedula})?`)) {
    store.eliminarEmpleado(emp.id)
      .then(() => notify.success('Empleado eliminado exitosamente'))
      .catch((err: any) => notify.error(err.data?.message || 'Error al eliminar empleado'))
  }
}
</script>

import { ref } from 'vue'
import { useQuasar } from 'quasar'
import { useBranchesStore, type Branch } from '../../stores/branches'
import { useNotifications } from '../core/useNotifications'

export function useBranchForm() {
  const store = useBranchesStore()
  const notify = useNotifications()
  const $q = useQuasar()

  const isDialogOpen = ref(false)
  const isEditing = ref(false)
  const loading = ref(false)

  const form = ref({
    id: 0,
    code: '',
    name: '',
    description: '',
    active: true
  })

  const resetForm = () => {
    form.value = {
      id: 0,
      code: '',
      name: '',
      description: '',
      active: true
    }
  }

  const openCreate = () => {
    resetForm()
    isEditing.value = false
    isDialogOpen.value = true
  }

  const openEdit = (branch: Branch) => {
    form.value = {
      id: branch.id,
      code: branch.code,
      name: branch.name,
      description: branch.description || '',
      active: branch.active
    }
    isEditing.value = true
    isDialogOpen.value = true
  }

  const submit = async () => {
    loading.value = true
    try {
      if (isEditing.value) {
        await store.update(form.value.id, form.value)
        notify.success('Sede actualizada exitosamente')
      } else {
        await store.create(form.value)
        notify.success('Sede creada exitosamente')
      }
      isDialogOpen.value = false
    } catch (e: any) {
      notify.error(e.data?.message || 'Error al guardar la sede')
    } finally {
      loading.value = false
    }
  }

  const remove = (branch: Branch) => {
    $q.dialog({
      title: 'Confirmar Eliminación',
      message: `¿Estás seguro de que deseas eliminar la sede '${branch.name}'?`,
      cancel: true,
      persistent: true,
      ok: { label: 'Eliminar', color: 'negative', flat: true }
    }).onOk(async () => {
      try {
        await store.remove(branch.id)
        notify.success('Sede eliminada exitosamente')
      } catch (e: any) {
        notify.error(e.data?.message || 'Error al eliminar la sede')
      }
    })
  }

  return {
    isDialogOpen,
    isEditing,
    loading,
    form,
    openCreate,
    openEdit,
    submit,
    remove
  }
}

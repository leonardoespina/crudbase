import { ref } from 'vue'
import { useQuasar } from 'quasar'
import { useRolesStore, type RoleItem } from '../../stores/roles'
import { useNotifications } from '../core/useNotifications'

export function useRoleForm() {
  const store = useRolesStore()
  const notify = useNotifications()
  const $q = useQuasar()

  const isDialogOpen = ref(false)
  const isEditing = ref(false)
  const loading = ref(false)

  const form = ref<{
    id: number
    name: string
    description: string
    permissions: {
      moduleId: number
      moduleCode: string
      moduleName: string
      category: string
      canCreate: boolean
      canRead: boolean
      canUpdate: boolean
      canDelete: boolean
    }[]
  }>({
    id: 0,
    name: '',
    description: '',
    permissions: []
  })

  const initPermissions = (existingPermissions?: any[]) => {
    return store.modules.map((m) => {
      const match = existingPermissions?.find((p) => p.moduleId === m.id)
      return {
        moduleId: m.id,
        moduleCode: m.code,
        moduleName: m.name,
        category: m.category,
        canCreate: match ? !!match.canCreate : false,
        canRead: match ? !!match.canRead : false,
        canUpdate: match ? !!match.canUpdate : false,
        canDelete: match ? !!match.canDelete : false
      }
    })
  }

  const openCreate = async () => {
    await store.fetchModules()
    form.value = {
      id: 0,
      name: '',
      description: '',
      permissions: initPermissions()
    }
    isEditing.value = false
    isDialogOpen.value = true
  }

  const openEdit = async (role: RoleItem) => {
    await store.fetchModules()
    form.value = {
      id: role.id,
      name: role.name,
      description: role.description || '',
      permissions: initPermissions(role.permissions)
    }
    isEditing.value = true
    isDialogOpen.value = true
  }

  const setGroupPermissions = (groupModules: any[], value: boolean) => {
    groupModules.forEach((item) => {
      item.canCreate = value
      item.canRead = value
      item.canUpdate = value
      item.canDelete = value
    })
  }

  const submit = async () => {
    loading.value = true
    try {
      const payload = {
        name: form.value.name,
        description: form.value.description,
        permissions: form.value.permissions.map((p) => ({
          moduleId: p.moduleId,
          canCreate: p.canCreate,
          canRead: p.canRead,
          canUpdate: p.canUpdate,
          canDelete: p.canDelete
        }))
      }

      if (isEditing.value) {
        await store.update(form.value.id, payload)
        notify.success('Rol actualizado exitosamente')
      } else {
        await store.create(payload)
        notify.success('Rol creado exitosamente')
      }
      isDialogOpen.value = false
    } catch (e: any) {
      notify.error(e.data?.message || 'Error al guardar el rol')
    } finally {
      loading.value = false
    }
  }

  const remove = (role: RoleItem) => {
    if (role.isSystem) {
      notify.warning('Los roles del sistema están protegidos y no pueden eliminarse')
      return
    }

    $q.dialog({
      title: 'Confirmar Eliminación',
      message: `¿Estás seguro de que deseas eliminar el rol '${role.name}'?`,
      cancel: true,
      persistent: true,
      ok: { label: 'Eliminar', color: 'negative', flat: true }
    }).onOk(async () => {
      try {
        await store.remove(role.id)
        notify.success('Rol eliminado exitosamente')
      } catch (e: any) {
        notify.error(e.data?.message || 'Error al eliminar el rol')
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
    setGroupPermissions,
    submit,
    remove
  }
}

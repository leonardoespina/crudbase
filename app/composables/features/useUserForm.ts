import { ref } from 'vue'
import { useQuasar } from 'quasar'
import { useUsersStore, type UserItem } from '../../stores/users'
import { useRolesStore } from '../../stores/roles'
import { useBranchesStore } from '../../stores/branches'
import { useNotifications } from '../core/useNotifications'

export function useUserForm() {
  const store = useUsersStore()
  const rolesStore = useRolesStore()
  const branchesStore = useBranchesStore()
  const notify = useNotifications()
  const $q = useQuasar()

  const isDialogOpen = ref(false)
  const isEditing = ref(false)
  const loading = ref(false)

  const form = ref({
    id: 0,
    username: '',
    name: '',
    email: '',
    password: '',
    roleId: null as number | null,
    branchId: null as number | null,
    active: true
  })

  const resetForm = () => {
    form.value = {
      id: 0,
      username: '',
      name: '',
      email: '',
      password: '',
      roleId: null,
      branchId: null,
      active: true
    }
  }

  const loadCatalogs = async () => {
    await Promise.all([
      rolesStore.fetchRoles(),
      branchesStore.fetchBranches(true)
    ])
  }

  const openCreate = async () => {
    resetForm()
    await loadCatalogs()
    isEditing.value = false
    isDialogOpen.value = true
  }

  const openEdit = async (user: UserItem) => {
    await loadCatalogs()
    form.value = {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email || '',
      password: '',
      roleId: user.roleId,
      branchId: user.branchId || null,
      active: user.active
    }
    isEditing.value = true
    isDialogOpen.value = true
  }

  const submit = async () => {
    if (!form.value.roleId) {
      notify.warning('Debes seleccionar un rol para el usuario')
      return
    }

    loading.value = true
    try {
      if (isEditing.value) {
        await store.update(form.value.id, form.value)
        notify.success('Usuario actualizado exitosamente')
      } else {
        await store.create(form.value)
        notify.success('Usuario creado exitosamente')
      }
      isDialogOpen.value = false
    } catch (e: any) {
      notify.error(e.data?.message || 'Error al guardar el usuario')
    } finally {
      loading.value = false
    }
  }

  const remove = (user: UserItem) => {
    $q.dialog({
      title: 'Confirmar Eliminación',
      message: `¿Estás seguro de que deseas eliminar al usuario '${user.username}'?`,
      cancel: true,
      persistent: true,
      ok: { label: 'Eliminar', color: 'negative', flat: true }
    }).onOk(async () => {
      try {
        await store.remove(user.id)
        notify.success('Usuario eliminado exitosamente')
      } catch (e: any) {
        notify.error(e.data?.message || 'Error al eliminar el usuario')
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

# 🧠 Lógica Frontend y Gestión de Estado

**Stack:** Vue 3 (`<script setup lang="ts">`) + Pinia + Nuxt 3 (`ssr: false`).

## 1. Estructura en `app/`
```text
app/
  components/
    layout/        # AppHeader.vue, AppSidebar.vue
    shared/        # CrudTable.vue, FormDialog.vue, StatusBadge.vue
  composables/     # useNotify.ts, useConfirm.ts, useSocket.ts
  layouts/         # default.vue, auth.vue
  middleware/      # auth.global.ts (Guardia de instalación /setup y sesión JWT)
  pages/           # Vistas enrutadas por archivo
  plugins/         # socket.client.ts
  stores/          # auth.ts (useAuthStore), settings.ts (useSettingsStore)
```

## 2. Componentes y Vistas (`app/pages/**`, `app/components/**`)
- Usar siempre `<script setup lang="ts">`.
- Reutilizar los componentes base para todos los módulos CRUD:
  - `<SharedCrudTable>`: maneja búsqueda con debounce, paginación server-side (`@request`), estados de carga y vista móvil automática (`:grid="$q.screen.lt.md"`).
  - `<SharedFormDialog>`: envuelve modales de creación/edición con `<q-form>` y botones estandarizados.
  - `<SharedStatusBadge>`: chips semánticos de estado activo/inactivo.
- RECOMENDADO: mantener las páginas por debajo de ~250 líneas extrayendo formularios o sub-tablas complejas a `app/components/<modulo>/`.

## 3. Stores (Pinia)
- `useAuthStore()` (`app/stores/auth.ts`): gestiona `user`, `login`, `logout`, `fetchMe` y el helper reactivo de permisos `authStore.can('MODULE_CODE', 'action')`.
- `useSettingsStore()` (`app/stores/settings.ts`): gestiona el estado de instalación (`installed`) y el branding corporativo (`companyName`, `companyTaxId`, `companyLogo`).

## 4. Composables Core (`app/composables/**`)
- `useNotify()`: notificaciones tipo toast (`notifySuccess`, `notifyError`, `notifyWarning`).
- `useConfirm()`: diálogos de confirmación estandarizados antes de acciones destructivas (`confirmDelete`).
- `useSocket()`: suscripción reactiva a eventos Socket.io con limpieza automática en `onUnmounted`.

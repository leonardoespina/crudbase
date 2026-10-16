# 🔐 Seguridad, Autorización (RBAC Dinámico) y Auditoría

> Sistema en red local (LAN) ≠ sistema exento de seguridad. Todo endpoint debe validar sesión, permisos de módulo/acción y aislamiento por sede.

## 1. Autenticación y Sesiones LAN/HTTPS
- Contraseñas hasheadas con `bcrypt` (coste ≥ 10). PROHIBIDO almacenarlas en texto plano o exponer `passwordHash`.
- Sesión almacenada en cookie `auth_token` con `httpOnly: true` y `sameSite: 'lax'`.
- **Compatibilidad LAN sin HTTPS:** el flag `secure` de la cookie se controla mediante la variable de entorno `COOKIE_SECURE` (`false` para despliegues HTTP en IP local, `true` cuando hay TLS/Caddy/Nginx). PROHIBIDO parchar archivos compilados en producción.
- **Rate Limiting:** `/api/auth/login.post.ts` controla intentos fallidos por IP en ventana de 15 minutos (`429 Too Many Requests`).

## 2. Autorización (RBAC Dinámico en Base de Datos + Caché L1)

### 2.1 Modelo de Datos
- **`Module`**: catálogo de módulos del sistema (`code`, `name`, `icon`, `route`, `sortOrder`).
- **`Role`**: rol asignado al usuario (`code`, `name`, `isSystem`). Los roles con `isSystem: true` (`ADMIN`, `OPERATOR`) no pueden eliminarse.
- **`RolePermission`**: matriz `roleId × moduleId` con 4 acciones booleanas:
  - `canCreate` (`create`)
  - `canRead` (`read`)
  - `canUpdate` (`update`)
  - `canDelete` (`delete`)

### 2.2 Verificación en Backend (Obligatoria)
- Todo endpoint protegido DEBE llamar a:
  ```ts
  const user = await requirePermission(event, 'MODULE_CODE', 'read' | 'create' | 'update' | 'delete')
  ```
- `requirePermission` (en `server/utils/auth.ts`) consulta la caché L1 (`permissionCache`) y si no existe hidrata desde PostgreSQL en `< 1ms`.
- El rol `ADMIN` tiene acceso total por diseño. Cualquier otro rol requiere que su fila en `RolePermission` tenga el flag correspondiente en `true`; de lo contrario lanza `403 Forbidden`.
- Al crear un módulo nuevo de negocio, DEBE registrarse su código en la tabla `Module` (en `prisma/seed.ts` y `setupService.ts`) para que aparezca automáticamente en la matriz visual de `/admin/roles`.

### 2.3 Aislamiento Multisede (`branchId`)
- NUNCA confiar en un `branchId` enviado por el cliente si el usuario no es `ADMIN`.
- En los servicios (`server/services/**`), si `actor.roleCode !== 'ADMIN'`, forzar siempre:
  ```ts
  where.branchId = actor.branchId
  ```

### 2.4 Verificación en Frontend (Solo UX)
- Usar `authStore.can('MODULE_CODE', 'create' | 'read' | 'update' | 'delete')` para mostrar/ocultar ítems en `LayoutAppSidebar.vue` y botones de acción en las vistas.
- **Recuerda:** ocultar un botón en Vue es UX; la seguridad real reside en `requirePermission` en el servidor.

## 3. Modo Instalación Seguro (`/setup`)
- Los endpoints `/api/setup/*` verifican primero `await isAppInstalled()`.
- Una vez que `app_installed === 'true'` en `SystemSetting`, cualquier intento de invocar `/api/setup/database` o `/api/setup/initialize` es rechazado con `403 Forbidden (ALREADY_INSTALLED)`.

## 4. Auditoría Inalterable (`AuditLog`)
- Toda creación, edición, cambio de permisos o borrado lógico relevante DEBE invocar `logAudit(tx, { userId, action, module, entityId, oldValues, newValues, ipAddress, userAgent })`.
- `AuditLog` es **append-only**: no tiene endpoints de edición ni borrado.

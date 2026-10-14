# 🔐 Seguridad, Autorización y Auditoría

> Sistema privado ≠ sistema seguro. La mayoría de incidentes en entornos pequeños son internos o por pérdida de datos.

## 1. Autenticación
- Contraseñas con `argon2` o `bcrypt` (coste ≥ 10). PROHIBIDO almacenarlas reversibles.
- Sesión en cookie `httpOnly`, `sameSite=lax`, `secure` si hay HTTPS (ej: `nuxt-auth-utils`). Evitar JWT en `localStorage`.
- **Rate limit** en `/api/auth/*` (ej: 5 intentos / 15 min por usuario+IP). Bloqueo temporal de cuenta, no baneo permanente de IP.

## 2. Autorización (RBAC por matriz)

### 2.1 Modelo
- **Permiso** = `recurso:acción` (ej: `work-order:close`). Acciones estándar: `read`, `create`, `update`, `delete`, más acciones de negocio (`approve`, `close`, `cancel`, `export`).
- **Rol** = conjunto de permisos. Un usuario tiene **un** rol (RECOMENDADO para sistemas pequeños; multi‑rol solo si `project.md` lo justifica).
- **Alcance (scope)** por permiso: `all` (todas las sedes/tenants), `branch` (solo la del usuario), `own` (solo registros propios/asignados).
- **Deny by default:** lo que no está en la matriz está prohibido.

### 2.2 Fuente única de verdad
- La matriz **concreta** del proyecto se documenta en `project.md` (tabla rol × permiso).
- En código vive en **un solo archivo** declarativo y tipado: `shared/auth/permissions.ts` (lo usan backend y frontend).

```ts
export const PERMISSIONS = ['work-order:read', 'work-order:close', /* ... */] as const
export type Permission = typeof PERMISSIONS[number]
export type Scope = 'all' | 'branch' | 'own'

export const ROLE_MATRIX: Record<Role, Partial<Record<Permission, Scope>>> = {
  ADMIN:    { 'work-order:read': 'all', 'work-order:close': 'all' },
  MECHANIC: { 'work-order:read': 'own' },
}
```
- PROHIBIDO comprobar roles por nombre en el código (`if (user.role === 'ADMIN')`). Siempre por permiso: `can(user, 'work-order:close')`.
- Roles en BD solo si `project.md` exige roles editables desde la UI; si no, la matriz en código (versionada en Git) es preferible.

### 2.3 Aplicación en backend (obligatoria)
- Función pura en domain: `can(actor, permission): Scope | null`.
- Handler: `requirePermission(event, 'work-order:close')` → 403 si no tiene permiso; devuelve `actor` con su scope.
- Service recibe `actor` y aplica reglas que dependen del dato (ej: "solo cerrar OT de su sede").
- Repository aplica el **scope** como filtro: `branch` → `where: { branchId: actor.branchId }`; `own` → `where: { assignedToId: actor.id }`.
- NUNCA confiar en `branchId`/`userId` enviados por el cliente sin validarlos contra la sesión.
- **Campos sensibles** (costos, salarios): permiso dedicado (ej: `cost:read`); si no lo tiene, el repository/service los omite del `select`.

### 2.4 Aplicación en frontend (solo UX)
- Composable `usePermissions()` con `can('work-order:close')` usando la misma matriz compartida.
- Oculta menús, rutas (middleware de Nuxt) y botones. **La seguridad real es la del backend.**

### 2.5 Pruebas y cambios
- Test unitario de la matriz: cada rol × permiso crítico devuelve el scope esperado.
- Test de integración: un rol sin permiso recibe 403 en endpoints sensibles.
- Cambiar la matriz = cambio de seguridad: commit propio (`feat(auth): ...`) y actualizar la tabla de `project.md`.

## 3. Validación de entrada
- Todo `body`/`query`/`params` DEBE validarse con Zod en el handler.
- Límite de payload (ej: 1 MB JSON; archivos con límite y tipo MIME explícito).
- Uploads: guardar fuera de `public/`, nombre generado por el servidor, nunca el original.

## 4. Auditoría
- Soft delete NO es auditoría. Tabla `AuditLog` (`actorId`, `action`, `entity`, `entityId`, `before`, `after`, `createdAt`) para operaciones sensibles (stock, precios, permisos, anulaciones).
- `AuditLog` es **append‑only**: sin update ni delete desde la aplicación.

## 5. Infraestructura on‑premise
- **Backups:** `pg_dump` diario automatizado, retención ≥ 30 días, copia fuera del servidor. Probar restauración periódicamente.
- HTTPS en LAN recomendado (certificado interno o reverse proxy Caddy).
- PostgreSQL sin exposición a la red pública; usuario de app sin privilegios de superusuario.
- Dependencias: `npm audit` antes de cada release.

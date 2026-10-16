# 📌 Contexto del Proyecto

> **Único archivo que se adapta por proyecto.** El resto de `.ai/` es genérico y reutilizable.
> Prevalece sobre las reglas genéricas cuando hay conflicto.

## 1. Identificación
- **Nombre:** CRUDBASE (Starter Empresarial Base)
- **Descripción corta:** Plataforma base empresarial lista para clonar y desplegar en LAN/On-Premise con Modo Instalación Web (`/setup`), Auth JWT HttpOnly, RBAC Dinámico en BD + Caché L1, Multisede, WebSockets en tiempo real y componentes UI Quasar.
- **Usuarios estimados:** ≈5‑50 usuarios concurrentes en red local (LAN) o VPS.
- **Despliegue:** Servidor On-Premise / LAN (Linux o Windows Server) con Node.js + PM2 (`ecosystem.config.cjs`) y PostgreSQL.

## 2. Stack Base
- Nuxt 3 (`ssr: false`) + TypeScript estricto
- Quasar Framework vía `nuxt-quasar-ui`
- PostgreSQL + Prisma con extensión de Soft Delete automático (`deletedAt`)
- Pinia (Gestión de estado en cliente: `useAuthStore`, `useSettingsStore`)
- Socket.io integrado en Nitro (`server/plugins/02.socket.ts`) y cliente (`useSocket`)
- LRU Cache en memoria (`server/utils/cache.ts`) para permisos RBAC y configuración
- Zod (Validación de esquemas de entrada y variables de entorno)
- Winston (Logging estructurado en `server/utils/logger.ts`)
- Dayjs con soporte UTC y conversión de zona horaria (`server/utils/time.ts`)

## 3. Modo Instalación (`/setup`) e Identidad Corporativa
- Si `SystemSetting('app_installed') !== 'true'` o la BD aún no tiene tablas, el middleware global redirige automáticamente a `/setup`.
- El asistente web (`/setup`) permite en 4 pasos:
  1. Probar conexión PostgreSQL, crear la base de datos si no existe, escribir `.env` y sincronizar el esquema Prisma (`POST /api/setup/database`).
  2. Configurar nombre de empresa, RIF/NIT y logo en Base64 (`SystemSetting`).
  3. Crear la sede principal (`Branch`).
  4. Crear el usuario Super Administrador (`ADMIN`) y sembrar los módulos/permisos base.
- Una vez instalado, `/api/setup/*` queda bloqueado permanentemente (`403 Forbidden`) y la identidad corporativa se edita desde `/admin/settings`.

## 4. Módulos Base Registrados
| Módulo | Código | Ruta Frontend | Descripción |
|---|---|---|---|
| Usuarios | `USERS` | `/admin/users` | Gestión de cuentas de usuario y asignación de rol/sede |
| Roles y Permisos | `ROLES` | `/admin/roles` | Matriz dinámica de permisos (`canCreate`, `canRead`, `canUpdate`, `canDelete`) editable en UI |
| Sedes | `BRANCHES` | `/admin/branches` | Gestión de sucursales o sedes operativas (Multisede) |
| Auditoría | `AUDIT` | `/admin/audit` | Bitácora inalterable (`AuditLog`) con diff JSON antes/después |
| Configuración | `SETTINGS` | `/admin/settings` | Nombre de empresa, RIF/NIT y logo en caliente |

## 5. Roles Iniciales (Semilla)
| Rol | Código | Alcance |
|---|---|---|
| Administrador General | `ADMIN` | Acceso total a todas las sedes y módulos (`isSystem: true`) |
| Operador Estándar | `OPERATOR` | Operaciones básicas limitadas a su sede asignada (`isSystem: true`) |

## 6. Multisede
- **Aplica:** Sí.
- **Columna de aislamiento:** `branchId` en entidades operativas y de negocio. Si el usuario no tiene `role.code === 'ADMIN'`, el backend fuerza el filtro `where.branchId = user.branchId`.

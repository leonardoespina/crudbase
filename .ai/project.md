# 📌 Contexto del Proyecto

> **Único archivo que se adapta por proyecto.** El resto de `.ai/` es genérico y reutilizable.
> Prevalece sobre las reglas genéricas cuando hay conflicto.

## 1. Identificación
- **Nombre:** CRUDBASE (Starter Empresarial Base)
- **Descripción corta:** Plataforma base empresarial para despliegue rápido con Auth, RBAC Dinámico, Multisede, WebSockets en tiempo real y componentes UI listos.
- **Usuarios estimados:** ≈5‑50 usuarios concurrentes en red local (LAN).
- **Despliegue:** Servidor On-Premise / LAN (Linux Debian o Windows Server) con Node.js + PM2 y PostgreSQL.

## 2. Stack Base
- Nuxt 3 (`ssr: false`) + TypeScript estricto
- Quasar Framework vía `nuxt-quasar-ui`
- PostgreSQL + Prisma con Soft Delete automático
- Pinia (Gestión de estado en cliente)
- Socket.io (WebSockets en tiempo real)
- Zod (Validación de esquemas y payloads)
- Winston (Logging estructurado)
- Dayjs con soporte UTC y timezone

## 3. Módulos Base Registrados
| Módulo | Código | Descripción |
|---|---|---|
| Usuarios | `USERS` | Gestión de cuentas de usuario y asignación de rol/sede |
| Roles y Permisos | `ROLES` | Matriz dinámica de permisos editables en pantalla |
| Sedes | `BRANCHES` | Gestión de sucursales o bases operativas (Multisede) |
| Auditoría | `AUDIT` | Bitácora inalterable de acciones de usuarios |
| Configuración | `SETTINGS` | Parámetros del sistema en tiempo de ejecución |

## 4. Roles Iniciales (Semilla)
| Rol | Código | Alcance |
|---|---|---|
| Administrador General | `ADMIN` | Acceso total a todas las sedes y módulos |
| Operador Estándar | `OPERATOR` | Operaciones básicas limitadas a su sede |

## 5. Multisede
- **Aplica:** Sí.
- **Columna de aislamiento:** `branchId` en entidades de negocio. Si el usuario no es `ADMIN`, el backend fuerza el filtro de su sede.

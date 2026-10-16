# ⚙️ Backend, Base de Datos y Utilidades Core

## 1. Prisma / PostgreSQL
- **Singleton:** importar SIEMPRE `prisma` desde `~/server/utils/prisma`. PROHIBIDO instanciar `new PrismaClient()` fuera de ese archivo (salvo en el instalador `/api/setup/database.post.ts` antes de inicializar el esquema).
- **Transacciones:** toda operación que modifique más de una tabla o registre auditoría DEBE usar `prisma.$transaction(async (tx) => { ... })`.
- **Select explícito:** las consultas sobre `User` NUNCA deben devolver `passwordHash`.
- **Dinero y cantidades fraccionarias:** DEBE usarse `Decimal` en Prisma (nunca `Float`).
- **Paginación:** todo listado de entidades de negocio DEBE ser paginado en servidor (`page`, `limit`, `search`).

## 2. Soft Delete Automático (`deletedAt`)
- PROHIBIDO borrar físicamente entidades de negocio (`User`, `Role`, `Branch`, y tablas operativas).
- `server/utils/prisma.ts` intercepta `findMany`, `findFirst`, `count`, `delete` y `deleteMany` para aplicar `deletedAt: null` y transformar borrados en `update({ data: { deletedAt: new Date() } })`.
- **Escape hatch:** si un caso de uso administrativo necesita consultar registros eliminados, pasar `_includeDeleted: true` en el objeto `where`.
- **Validación de unicidad con Soft Delete:** antes de crear o actualizar códigos/emails únicos, verificar colisiones con registros activos o usar índices únicos parciales.

## 3. Fechas y Zona Horaria (`server/utils/time.ts`)
- Toda fecha se almacena en **UTC** en PostgreSQL.
- Para filtrar cortes diarios o reportes ("ventas de hoy", "órdenes del día") según la hora local del cliente/sede (`TIMEZONE`), usar SIEMPRE `getLocalDayRangeUtc(dateStr)` de `server/utils/time.ts`.

## 4. Idempotencia en Operaciones Críticas (`server/utils/idempotency.ts`)
- En endpoints críticos (`POST` de pagos, cierres de orden, movimientos de stock), envolver la ejecución con `executeIdempotent(event, async () => { ... })`.
- Si el cliente envía la cabecera `x-idempotency-key`, el backend garantiza que un doble clic o corte de red en LAN no duplique la transacción.

## 5. Caché L1 en Memoria (`server/utils/cache.ts`)
- `permissionCache`: almacena la matriz de permisos de cada `roleId` (TTL 5 min). DEBE invalidarse con `invalidateRoleCache(roleId)` al editar permisos en `roleService.ts`.
- `settingsCache`: almacena `SystemSetting` como el estado de instalación y branding corporativo.

## 6. Tiempo Real (`server/plugins/02.socket.ts`)
- Socket.io corre en el mismo puerto que Nitro (`path: '/socket.io'`).
- Usar `emitSocketEvent(event, payload)` para eventos globales o `emitToBranch(branchId, event, payload)` para notificar únicamente a los clientes conectados de una sede específica.

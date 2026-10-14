# ⚙️ Backend, Datos y Eventos

## 1. Prisma / PostgreSQL
- **Singleton:** importar SIEMPRE desde `~/server/utils/prisma`. PROHIBIDO `new PrismaClient()` en otro lugar.
- **Transacciones:** si un caso de uso modifica varias tablas, el service usa `prisma.$transaction` (vía repository) y los repositorios aceptan `tx` opcional.
- **Select explícito:** consultas sobre usuarios NUNCA exponen `passwordHash`, tokens ni datos personales innecesarios.
- **IDs:** RECOMENDADO `cuid()`/`uuid()` (evita colisiones si en el futuro se sincronizan sedes).
- **Dinero y cantidades fraccionarias:** DEBE usarse `Decimal` (nunca `Float`).
- **Fechas:** guardar en UTC (`timestamptz`); convertir a zona local solo en frontend.
- **Paginación:** listados DEBEN paginar (por defecto 50, máx. 200).

## 2. Soft Delete (obligatorio)
- PROHIBIDO `delete()` / `deleteMany()` en entidades de negocio. Usar `deletedAt DateTime?`.
- DEBE existir una **Prisma Client Extension** que filtre `deletedAt: null` por defecto, para no filtrar a mano en cada query.
- Campos únicos (ej: código, placa, email) DEBEN usar **índice único parcial** `WHERE "deletedAt" IS NULL` (migración SQL manual).
- *Excepción:* tablas técnicas (sesiones, tokens expirados, caché) pueden borrarse físicamente.

## 3. Entorno (Fail‑Fast)
- Validar variables con Zod en `server/utils/env.ts` al arrancar (plugin Nitro).
- Si falta una crítica (`DATABASE_URL`, `SESSION_SECRET`, …): log de ERROR y `process.exit(1)`.
- PROHIBIDO leer `process.env` fuera de `env.ts`.
- `.env` NUNCA se commitea; mantener `.env.example` actualizado.

## 4. Errores y logging
- Services lanzan `DomainError` y subclases; `defineApiHandler` los traduce a HTTP. Errores no controlados → 500 genérico sin stack al cliente.
- Logger estructurado (ej: `consola`/`pino`) con nivel por entorno. PROHIBIDO loguear contraseñas, tokens o payloads completos.

## 5. Eventos desacoplados (mitt)
- Bus in‑memory en `server/utils/eventBus.ts`, tipado (`type Events = { 'order:created': Order }`).
- **Nomenclatura:** hechos pasados `entidad:verbo-pasado` (`stock:depleted`).
- **Emisión:** SOLO services, y **después** de confirmar la transacción.
- **Listeners** (`server/plugins/eventListeners.ts`): `mitt` es síncrono, por lo que cada listener DEBE ejecutar su trabajo en `setImmediate`/`queueMicrotask` y envolverlo en `try/catch`. Un listener NUNCA rompe el flujo del emisor.
- Los eventos in‑memory se pierden al reiniciar. Si un efecto es **crítico** (sincronización, facturación, notificaciones obligatorias) usar una tabla **outbox** persistente.
- Socket.io (si se usa) es solo un listener más del bus.

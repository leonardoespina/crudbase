# 🏗️ Arquitectura Backend (3 Capas Pragmáticas)

**Stack:** Nuxt 3 (Nitro) + TypeScript estricto (`strict: true`).

## 1. Estructura del Servidor
```text
server/
  api/           # Capa 1 (Controlador HTTP): Rutas, auth, validación Zod de entrada
  services/      # Capa 2 (Negocio): Reglas de dominio, transacciones, auditoría, Socket.io
  utils/         # Capa 3 (Infraestructura/Datos):
    prisma.ts    # Singleton de Prisma + Extensión de Soft Delete
    auth.ts      # JWT, cookies HttpOnly, requireAuth, requirePermission
    cache.ts     # Caché L1 en memoria (LRU) para permisos y SystemSetting
    errors.ts    # AppError y handleApiError
    audit.ts     # logAudit() para trazabilidad en AuditLog
    idempotency.ts # executeIdempotent() contra doble clic / reintentos de red
    time.ts      # Fechas UTC y rangos por zona horaria local
    logger.ts    # Logger estructurado con Winston
  plugins/
    01.env-check.ts # Validación Fail-Fast de variables de entorno
    02.socket.ts    # Servidor Socket.io acoplado a Nitro
```

## 2. Responsabilidades por Capa

### Capa 1 — Handlers HTTP (`server/api/**`)
- Autenticar y autorizar la petición con `requireAuth(event)` o `requirePermission(event, 'MODULE_CODE', 'action')`.
- Extraer y validar `body`, `query` o `params` usando esquemas **Zod**.
- Delegar la ejecución a un servicio en `server/services/`.
- Capturar errores mediante `handleApiError(event, error)`.
- **PROHIBIDO:** escribir lógica de negocio compleja o transacciones multi-tabla directamente en el handler.

### Capa 2 — Servicios de Negocio (`server/services/**`)
- Contienen toda la lógica de negocio, validaciones de dominio y aislamiento multisede (`branchId`).
- Ejecutan escrituras compuestas dentro de `prisma.$transaction(async (tx) => { ... })`.
- Registran auditoría con `logAudit(tx, ...)` dentro de la misma transacción.
- Emiten eventos en tiempo real (`emitSocketEvent`, `emitToBranch`) **después** de confirmar la transacción.
- Lanzan errores controlados mediante `new AppError(statusCode, code, message)` (ej. `400`, `403`, `404`, `409`).
- **PROHIBIDO:** depender del objeto HTTP `H3Event` cuando el servicio pueda recibir parámetros tipados + `actor`.

### Capa 3 — Acceso a Datos (`server/utils/prisma.ts`)
- Único punto de instancia de `PrismaClient`.
- Incorpora la extensión automática de **Soft Delete** (`deletedAt: null`).

## 3. Contratos Estándar de Respuesta API
- **Listados paginados (`GET`):** DEBEN devolver siempre la estructura:
  ```ts
  {
    items: T[],
    meta: {
      total: number,
      page: number,
      limit: number,
      totalPages: number
    }
  }
  ```
- **Errores HTTP:** `handleApiError` estandariza las respuestas de error con `{ statusCode, statusMessage, data: { code } }`.

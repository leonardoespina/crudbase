# 🏗️ Arquitectura Hexagonal Ligera

**Stack:** Nuxt 3 (Nitro) + TypeScript estricto (`strict: true`).

## Estructura
```
server/
  domain/        # Capa 1: tipos, reglas puras, errores, puertos (interfaces)
  repository/    # Capa 2: acceso a datos (único lugar con prisma)
  services/      # Capa 3: casos de uso
  api/           # Capa 4: handlers HTTP
  utils/         # prisma singleton, eventBus, defineApiHandler, env
  plugins/       # arranque Nitro (env check, listeners)
```

## Capa 1 — Domain (`server/domain/`)
- Tipos, interfaces, validaciones puras, cálculos de negocio, jerarquía de errores (`DomainError`, `ValidationError`, `NotFoundError`, `ForbiddenError`, `ConflictError`).
- **Puertos:** interfaces para dependencias externas (ej: `AiProvider`, `Notifier`) que implementan los services/adaptadores.
- **PROHIBIDO:** importar librerías externas (prisma, h3, mitt, etc.). Solo funciones puras. *Excepción permitida:* esquemas Zod de validación.

## Capa 2 — Repository (`server/repository/`)
- **ÚNICO** lugar donde se importa `prisma`.
- Solo queries. Acepta un cliente de transacción opcional (`tx`).
- **PROHIBIDO:** decisiones de negocio, validaciones, emitir eventos.

## Capa 3 — Service (`server/services/`)
- Orquesta casos de uso: decide, coordina transacciones, emite eventos.
- **PROHIBIDO:** importar prisma; conocer HTTP (`event`, `readBody`).
- **Tamaño RECOMENDADO:** ≤150 líneas. **DEBE** dividirse si supera ~250 líneas en sub‑servicios cohesivos: `server/services/<modulo>/{index,create,query,...}.ts`.

## Capa 4 — Handler (`server/api/`)
- Adaptador HTTP: parsear y validar input (Zod), obtener usuario de sesión, llamar a **un** service, devolver respuesta.
- **DEBE** envolverse en `defineApiHandler()` (mapea `DomainError` → código HTTP).
- **PROHIBIDO:** lógica de negocio, emitir eventos. Tamaño RECOMENDADO: ≤20 líneas.

## Regla de dependencias
✅ `Handler → Service → Repository` y todos pueden usar `Domain`.

- Repository nunca importa Service. Service nunca importa Handler.
- **CRUD trivial** (catálogos sin reglas): el handler puede llamar al repository directamente.
- Un archivo no debe depender de más de 2 capas adyacentes (+ Domain).

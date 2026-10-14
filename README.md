# 🏛️ CRUDBASE — Starter Empresarial Base

> Plataforma base reutilizable para **sistemas empresariales privados (on-premise / LAN) de 5 a 50 usuarios**.
> Diseñada para despliegue rápido, alta mantenibilidad, Clean Architecture y cero sobre-ingeniería.

---

## 🚀 Características Principales

* **Stack Moderno:** Nuxt 3 (`ssr: false`) + Quasar Framework (`nuxt-quasar-ui`) + Vue 3 (Composition API).
* **Base de Datos & ORM:** PostgreSQL + Prisma con **Soft Delete automático**, índices únicos y prevención de fugas de contraseñas.
* **Seguridad y RBAC Dinámico en BD:**
  * Autenticación por cookies `HttpOnly` adaptables a red local HTTP (`COOKIE_SECURE=false`) o HTTPS.
  * Control de **Sesión Única** en tiempo real.
  * Matriz de roles y permisos granular (`canCreate`, `canRead`, `canUpdate`, `canDelete`) editable 100% desde la interfaz de usuario.
* **Multisede Nativo:** Aislamiento de datos por sucursal (`branchId`) con scoping forzado en repositorios y acceso global para Administradores.
* **Tiempo Real (WebSockets):** Socket.io integrado en Nitro con salas por sede (`branch_id`) y revocación instantánea de sesiones.
* **Caché L1 en Memoria:** Permisos de roles y configuraciones en memoria RAM de Node con invalidación reactiva por `eventBus`.
* **Idempotencia Transaccional:** Soporte nativo de cabecera `Idempotency-Key` para evitar operaciones duplicadas por doble clic o microcortes de red.
* **Manejo de Horas en UTC:** Cálculos de "días de negocio" precisos y renderizado en huso horario local de la empresa.
* **Despliegue On-Premise con PM2:** Archivo `ecosystem.config.cjs` listo para producción sin scripts sucios de parcheo.
* **Generador Rápido de CRUDs:** Script CLI (`npm run gen:crud -- Entidad`) para crear módulos completos en 1 segundo.

---

## 📁 Estructura del Proyecto

```
crudbase/
├── .agents/                 # Matriz de reglas para Agentes IA
├── .ai/                     # Reglas arquitectónicas (backend, frontend, seguridad, ui)
├── app/
│   ├── components/
│   │   ├── layout/          # AppHeader.vue, AppSidebar.vue
│   │   └── shared/          # CrudTable.vue (Modo Grid móvil), FormDialog.vue, StatusBadge.vue
│   ├── composables/
│   │   ├── core/            # useNotifications, usePermissions, useSocket, useFormatDate
│   │   └── features/        # useUserForm, useRoleForm, useBranchForm
│   ├── layouts/             # default.vue, blank.vue
│   ├── middleware/          # auth.global.ts
│   ├── pages/               # login.vue, index.vue, admin/ (users, roles, branches, audit)
│   ├── plugins/             # socket.client.ts
│   └── stores/              # auth.ts, users.ts, roles.ts, branches.ts, audit.ts
├── server/
│   ├── api/                 # auth/, users/, roles/, branches/, modules/, audit/
│   ├── domain/              # errors.ts
│   ├── repository/          # branchRepository, roleRepository, userRepository, auditRepository
│   ├── services/            # authService, branchService, roleService, userService, auditService
│   ├── utils/               # prisma.ts, auth.ts, handler.ts, cache.ts, time.ts, idempotency.ts, logger.ts
│   └── plugins/             # 01.env.ts (Fail-Fast), 02.socket.ts (WebSockets)
├── prisma/
│   ├── schema.prisma        # Modelos con Soft Delete y multisede
│   └── seed.ts              # Semilla inicial (Admin, Operador, Sede Central, Módulos)
├── scripts/
│   └── gen-crud.ts          # CLI para generar nuevos módulos
├── ecosystem.config.cjs     # Configuración para PM2
├── nuxt.config.ts
└── package.json
```

---

## 🛠️ Instalación y Puesta en Marcha

### 1. Requisitos Previos
* Node.js v18 o superior
* PostgreSQL 14+ instalado y corriendo

### 2. Clonar y Configurar
```bash
git clone https://github.com/leonardoespina/crudbase.git
cd crudbase
npm install
```

### 3. Variables de Entorno
Copia el archivo `.env.example` a `.env`:
```bash
cp .env.example .env
```
Edita `.env` con la URL de tu base de datos y un secreto JWT seguro:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/crudbase_db?schema=public"
JWT_SECRET="cambia_este_secreto_en_produccion_con_uno_de_mas_de_32_chars"
APP_TIMEZONE="America/Caracas"
COOKIE_SECURE="false" # 'false' para LAN HTTP puro; 'true' si usas HTTPS
```

### 4. Sincronizar Base de Datos y Semilla Inicial
```bash
npm run prisma:push
npm run prisma:seed
```

> **Credenciales por defecto creadas por el seed:**
> * **Usuario:** `admin`
> * **Contraseña:** `admin1234`

### 5. Iniciar en Desarrollo
```bash
npm run dev
```
Abre tu navegador en `http://localhost:3000`.

---

## ⚡ Despliegue en Producción con PM2 (Debian / Linux / Windows)

```bash
# 1. Compilar aplicación
npm run build

# 2. Iniciar proceso en PM2
pm2 start ecosystem.config.cjs

# 3. Guardar estado de PM2 para reinicio automático del servidor
pm2 save
```

---

## 🪄 Generar un Nuevo Módulo CRUD en 1 Segundo

Para crear un nuevo módulo (por ejemplo `Product`, `Vehicle`, `Client`):
```bash
npm run gen:crud -- Product
```
El script generará automáticamente:
* `server/repository/productRepository.ts`
* `server/services/productService.ts`
* `server/api/products/index.get.ts`, `index.post.ts`, `[id].put.ts`, `[id].delete.ts`
* `app/stores/products.ts`

Solo debes agregar el modelo en `prisma/schema.prisma`, ejecutar `npm run prisma:push` y listo.

---

## 📄 Licencia
Privado / Uso Empresarial Interno.

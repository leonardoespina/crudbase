# 🚀 Especificación Técnica: Modo Instalación (Setup Wizard) y Configuración Corporativa

> **Documento de Diseño Arquitectónico (RFC)**  
> **Proyecto:** `CRUDBASE` / Plataforma Base Empresarial On-Premise  
> **Estado:** Propuesta Técnica Aprobada  
> **Fecha:** Octubre 2026  

---

## 1. Introducción y Objetivo

El **Modo Instalación (Setup Wizard)** es un mecanismo interactivo y guiado que permite aprovisionar una nueva instancia del sistema en un cliente o servidor local **directamente desde el navegador**, sin necesidad de ejecutar comandos manuales en la consola ni modificar archivos de código.

### Objetivos Clave:
1. **Despliegue Cero-Fricción:** Al clonar el proyecto y conectarlo a una base de datos limpia, la primera persona que abre la URL es guiada para inicializar el sistema.
2. **Personalización de Marca (White-Label):** Configurar el nombre comercial de la empresa, su identificación fiscal, su zona horaria y subir su logotipo corporativo.
3. **Aislamiento Multisede Inicial:** Crear la sede matriz u oficina principal que servirá de ancla para la operación.
4. **Seguridad Absoluta (Sellado Post-Instalación):** Una vez completado el proceso, el instalador se bloquea permanentemente con candado a nivel de base de datos y backend, impidiendo cualquier intento de reinicialización.

---

## 2. Flujo de Detección y Ciclo de Vida

El sistema opera bajo una máquina de dos estados: **`NO_INSTALADO`** e **`INSTALADO`**.

```
                           Petición HTTP del Navegador
                                      │
                                      ▼
                        [ Middleware auth.global.ts ]
                                      │
                   ¿Existe la bandera SYSTEM_INSTALLED?
                                      │
                  ┌───────────────────┴───────────────────┐
                  ▼ (NO)                                  ▼ (SÍ)
       ¿Ruta actual es /setup?                 ¿Ruta actual es /setup?
            │             │                         │             │
        (SÍ)│         (NO)│                     (SÍ)│         (NO)│
            ▼             ▼                         ▼             ▼
       Permite ver   Redirige a                Redirige a    Flujo normal
        el Wizard      /setup                    /login      (Login/App)
```

### Reglas de Seguridad del Ciclo de Vida:
* **Candado en Backend:** El endpoint de ejecución `POST /api/setup/install` consulta directamente a la base de datos antes de procesar cualquier dato. Si `SYSTEM_INSTALLED = true` o ya existe al menos un usuario en la tabla `users`, responde de inmediato con **`403 Forbidden`**.
* **Idempotencia de Arranque:** Si dos operadores abren el asistente simultáneamente, la transacción de base de datos utiliza aislamiento transaccional para que solo el primero pueda consolidar la instalación.

---

## 3. Asistente Paso a Paso en Frontend (`/setup`)

Construido utilizando el componente `<q-stepper>` de Quasar Framework, garantizando responsividad en monitores, portátiles y tablets.

### Paso 1: Diagnóstico y Bienvenida
* Saludo inicial e inspección automática de prerrequisitos:
  * Conexión con PostgreSQL: ✅ Establecida.
  * Versión de Node.js en servidor: ✅ Compatible.
  * Servicio de WebSockets: ✅ Operativo.
* Botón de avance: *"Comenzar Configuración"*.

### Paso 2: Identidad Corporativa de la Empresa
* **Nombre de la Empresa / Razón Social:** *(Obligatorio, ej: "Inversiones & Talleres del Centro C.A.")*.
* **Identificación Fiscal:** *(Opcional, ej: RIF, NIT, RUT, CIF)*.
* **Logotipo de la Empresa:** Selector de archivo (`image/png`, `image/jpeg`, `image/webp`, máx. 2 MB) con:
  * Previsualización instantánea en pantalla.
  * Botón para recortar o eliminar antes de guardar.
* **Zona Horaria de Operación:** Selector desplegable con búsqueda rápida (por defecto la configurada en el servidor, ej: `America/Caracas`, `America/Bogota`, `America/Mexico_City`).

### Paso 3: Sede Principal (Matriz)
* **Código de la Sede:** *(Obligatorio, mayúsculas, ej: `CENTRAL`, `MATRIZ`)*.
* **Nombre de la Sede:** *(Obligatorio, ej: "Sede Principal / Taller Central")*.
* **Dirección o Descripción:** *(Opcional, dirección física del taller o galpón)*.

### Paso 4: Creación del Administrador Maestro
* **Nombre Completo:** *(Ej: "Administrador del Sistema")*.
* **Nombre de Usuario:** *(Obligatorio, mínimo 3 caracteres, ej: `admin` o personalizado)*.
* **Correo Electrónico:** *(Opcional)*.
* **Contraseña Maestra:** *(Mínimo 6 caracteres, con medidor visual de fortaleza y botón de visibilidad)*.
* **Confirmación de Contraseña:** *(Validación en tiempo real)*.

### Paso 5: Confirmación y Provisionamiento
* Resumen visual de los datos ingresados antes de confirmar.
* Botón de acción principal: **`[ Inicializar Sistema ]`**.
* Al hacer clic:
  * Barra de progreso con estado (`:loading`).
  * Ejecución de la transacción en el servidor.
  * Notificación de éxito: *"¡Instalación completada exitosamente!"*.
  * Redirección automática a `/login` con el logo y el nombre de la empresa ya cargados.

---

## 4. Diseño de Base de Datos y Almacenamiento

### 4.1 Modelo de Parámetros (`SystemSetting`)
Se aprovecha la tabla existente `system_settings`:

```prisma
model SystemSetting {
  id          Int      @id @default(autoincrement())
  key         String   @unique
  value       String   @db.Text
  description String?
  isPublic    Boolean  @default(false) @map("is_public") // True si puede leerse sin login (ej: logo, nombre)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@map("system_settings")
}
```

### 4.2 Parámetros Almacenados en la Instalación:
| Clave (`key`) | Descripción | Acceso Público | Ejemplo de Valor |
|---|---|---|---|
| `SYSTEM_INSTALLED` | Bandera de sellado del sistema | `false` | `"true"` |
| `COMPANY_NAME` | Nombre comercial de la empresa | `true` | `"SIGAT Taller Mecánico C.A."` |
| `COMPANY_TAX_ID` | RIF o documento fiscal | `true` | `"J-12345678-9"` |
| `COMPANY_LOGO` | Logotipo en Data-URI / URL | `true` | `"data:image/png;base64,iVBORw..."` |
| `APP_TIMEZONE` | Zona horaria del sistema | `true` | `"America/Caracas"` |
| `COMPANY_PRIMARY_COLOR` | Color corporativo de la interfaz | `true` | `"#1976D2"` |

### 4.3 Estrategia de Almacenamiento del Logotipo:
* **Enfoque Recomendado para On-Premise:** Almacenar el logo directamente como **Data-URI Base64** en el campo `value` de `SystemSetting`.
* **Ventajas para Servidores Locales / LAN:**
  1. **Cero dependencia del sistema de archivos:** No requiere configurar carpetas con permisos `chmod 777` en Linux ni lidiar con rutas estáticas en Windows.
  2. **Backups Atómicos:** Al hacer un `pg_dump` de la base de datos, el logotipo se respalda automáticamente junto con toda la información. Si restauras la base de datos en otra máquina, la empresa ya tiene su logo sin copiar carpetas.

---

## 5. Especificación de Endpoints del Backend

### 5.1 `GET /api/setup/status`
* **Acceso:** Público (Sin autenticación).
* **Propósito:** Informa al frontend si el sistema ya está configurado.
* **Respuesta (200 OK):**
  ```json
  {
    "isInstalled": false,
    "hasDatabaseConnection": true
  }
  ```

### 5.2 `POST /api/setup/install`
* **Acceso:** Público, pero con **candado de una sola ejecución**.
* **Payload de Entrada:**
  ```json
  {
    "company": {
      "name": "Transportes del Centro C.A.",
      "taxId": "J-50123456-7",
      "logo": "data:image/png;base64,...",
      "timezone": "America/Caracas"
    },
    "branch": {
      "code": "CENTRAL",
      "name": "Sede Principal",
      "description": "Galpón 4, Zona Industrial"
    },
    "admin": {
      "username": "admin",
      "name": "Leonardo Espina",
      "email": "admin@empresa.com",
      "password": "PasswordSeguro2026*"
    }
  }
  ```
* **Lógica del Servicio (`InstallService`):**
  1. Verifica que `SYSTEM_INSTALLED` no exista o sea `false`.
  2. Inicia transacción atómica de Prisma (`prisma.$transaction`):
     - Inserta los módulos base (`USERS`, `ROLES`, `BRANCHES`, `AUDIT`, `SETTINGS`).
     - Crea la Sede Matriz.
     - Crea el Rol `ADMIN` (protegido) con todos los permisos en `true`.
     - Crea el Rol `OPERATOR` con permisos de consulta.
     - Aplica hash seguro con `bcrypt` (cost 10) a la contraseña del usuario administrador.
     - Crea la cuenta del Administrador asignada al rol `ADMIN` con acceso global (`branchId = null`).
     - Inserta los registros de `system_settings` (`COMPANY_NAME`, `COMPANY_LOGO`, etc.).
     - Inserta `SYSTEM_INSTALLED = 'true'`.
     - Registra el primer evento en la tabla `audit_logs` con la acción `SYSTEM_INSTALLATION`.
  3. Responde `200 OK`: `{ success: true, message: "Instalación completada exitosamente" }`.

### 5.3 `GET /api/settings/public`
* **Acceso:** Público (Sin autenticación).
* **Propósito:** Provee al componente de Login y a la barra superior los datos de marca de la empresa antes de iniciar sesión.
* **Respuesta (200 OK):**
  ```json
  {
    "appName": "Transportes del Centro C.A.",
    "taxId": "J-50123456-7",
    "logo": "data:image/png;base64,...",
    "timezone": "America/Caracas",
    "primaryColor": "#1976D2"
  }
  ```

### 5.4 `PUT /api/settings`
* **Acceso:** Requiere autenticación y permiso de Administrador (`SETTINGS:update`).
* **Propósito:** Permite al Administrador cambiar el logo, el nombre comercial o la zona horaria desde la pantalla `/admin/settings` en cualquier momento posterior.

---

## 6. Módulo Post-Instalación: Ajustes Corporativos (`/admin/settings`)

Una vez instalado el sistema, el menú lateral incluirá la opción **"Configuración General"** donde el administrador puede:
1. **Actualizar Identidad:** Cambiar el nombre comercial o RIF.
2. **Reemplazar Logotipo:** Subir un nuevo logo cuando la empresa renueve su imagen corporativa.
3. **Personalización del Tema Visual:** Cambiar el color primario de Quasar con un selector de color interactivo (`<q-color>`), aplicando el cambio dinámicamente con:
   ```ts
   import { colors } from 'quasar'
   colors.setCssVar('primary', newColorHex)
   ```

---

## 7. Plan de Implementación de Archivos en `crudbase`

Para integrar este módulo en el repositorio, la estructura de archivos queda así:

```
crudbase/
├── app/
│   ├── pages/
│   │   ├── setup.vue                # 📄 Asistente interactivo con QStepper
│   │   └── admin/
│   │       └── settings/index.vue   # 📄 Pantalla de ajustes corporativos y logo
│   ├── stores/
│   │   └── settings.ts              # 📦 Store de configuración pública y tema
│   └── middleware/
│       └── auth.global.ts           # 🔄 Interceptor que redirige a /setup si no está instalado
├── server/
│   ├── api/
│   │   ├── setup/
│   │   │   ├── status.get.ts        # 🔌 Consulta estado de instalación
│   │   │   └── install.post.ts      # 🔌 Transacción de aprovisionamiento
│   │   └── settings/
│   │       ├── public.get.ts        # 🔌 Parámetros públicos (Logo, Nombre)
│   │       └── index.put.ts         # 🔌 Actualización por el Administrador
│   └── services/
│       └── setupService.ts          # ⚙️ Caso de uso del aprovisionamiento atómico
└── docs/
    └── MODO_INSTALACION_SETUP_WIZARD.md # 📘 Esta especificación técnica
```

---

## 8. Conclusión

Con esta arquitectura:
1. El sistema se convierte en un producto empaquetable y listo para entregar a clientes.
2. Se eliminan los pasos manuales de seeding o creación de usuarios por base de datos.
3. La empresa cliente siente que el software es 100% suyo desde el primer segundo gracias al logotipo y colores personalizados.
4. La seguridad queda blindada contra reinicios o modificaciones no autorizadas.

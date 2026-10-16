# 🎨 Interfaz Visual y UX (Quasar Framework)

**Stack:** Quasar Framework vía `nuxt-quasar-ui` + Material Icons.

## 1. Estándares Visuales
- Utilizar los componentes de Quasar (`q-card`, `q-btn`, `q-input`, `q-select`, `q-table`, `q-banner`, `q-stepper`) con diseño limpio (`flat`, `bordered`, `outlined`, `dense` en formularios).
- PROHIBIDO usar `alert()` o `confirm()` nativos del navegador: usar siempre `useNotify()` y `useConfirm()`.
- Tema de colores corporativo centralizado en `nuxt.config.ts` (`quasar.config.brand`) y variables globales en `app/assets/scss/main.scss`.

## 2. Responsividad y Tablas Adaptativas
- Utilizar el sistema de grillas de Quasar (`row q-col-gutter-md`, `col-12 col-md-6`).
- Todas las tablas de listado DEBEN usar `<SharedCrudTable>` que activa automáticamente `:grid="$q.screen.lt.md"`, transformando las filas en tarjetas legibles cuando se abre desde celulares o tablets.

## 3. Prevención de Errores en Formularios
- Todo botón de guardado o acción asíncrona DEBE vincular `:loading="saving"` para evitar múltiples envíos.
- Validar campos obligatorios en cliente mediante `:rules="[val => !!val || 'Campo obligatorio']"` además de la validación Zod en backend.
- En acciones de eliminación (Soft Delete), solicitar confirmación mediante `useConfirm().confirmDelete(nombreEntidad)`.

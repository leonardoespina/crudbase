# 🎨 Interfaz Visual y UX

**Stack:** Quasar Framework integrado vía `nuxt-quasar-ui`.

## 1. Estilos
- Interfaz con componentes Quasar (`q-card`, `q-btn`, `q-input`, `q-table`) y clases utilitarias (`q-pa-md`, `text-primary`).
- PROHIBIDO CSS inline (`style="..."`) y HTML primitivo cuando existe equivalente Quasar (`<button>`, `<table>`, `<input>`, `<select>`).
- PROHIBIDO `<style>` en componentes. **Excepciones permitidas** (con `scoped`): vistas de impresión (`@media print`) y contenedores de gráficos.
- Tema (colores de marca) centralizado en la configuración de Quasar / `app.scss`, nunca por componente.

## 2. Responsividad
- Grilla Quasar (`row q-col-gutter-md`, `col-12 col-md-6`).
- Tablas extensas: ocultar columnas secundarias en pantallas pequeñas (`$q.screen.lt.md`) o usar `q-table` en modo `grid`/tarjetas en móvil.
- Acciones principales con tamaño táctil adecuado (`size="md"` o mayor) para uso en tablet/móvil.

## 3. Prevención de errores
- Todo botón que envía datos DEBE usar `:loading` mientras dura la petición (evita doble envío).
- Guardados y acciones destructivas notifican con el composable `useNotifications()`. PROHIBIDO `alert()`/`confirm()` nativos.
- Acciones irreversibles o de borrado: confirmación con `$q.dialog()`.
- Formularios: validación en cliente (reglas Quasar) como ayuda, la validación real es en el backend.

## 4. Estados de vista
- Toda vista con datos maneja: cargando (`q-skeleton`/`q-inner-loading`), vacío (mensaje + acción), error (mensaje + reintentar).

# 🧠 Lógica Frontend

**Stack:** Vue 3 (`<script setup lang="ts">`) + Pinia + Nuxt 3 (`ssr: false` para apps internas).

## 1. Componentes (.vue)
- Los componentes **renderizan y orquestan**; no contienen reglas de negocio.
- PROHIBIDO `$fetch`/`useFetch` en componentes: las llamadas pasan por un store de Pinia.
- RECOMENDADO: ≤5 variables reactivas propias de UI (`ref`/`reactive`). Si hay lógica de negocio o flujos complejos, extraer a un composable.
- RECOMENDADO: ≤250 líneas por componente; dividir en subcomponentes.

## 2. Composables (`composables/useXxx.ts`)
- Flujos de formulario, cálculos, coordinación entre store y UI (notificaciones, diálogos, navegación).
- Estado de solo lectura expuesto con `readonly()`. **Excepción:** el modelo de un formulario puede exponerse mutable para `v-model`.
- Sin templates.

## 3. Stores (Pinia)
- Único puente al backend HTTP. Setup Pattern: `defineStore('name', () => { ... })`.
- Tras `POST/PUT/DELETE` exitoso, actualizar el estado local en vez de recargar toda la lista.
- PROHIBIDO en stores: toasts, diálogos, router. El store retorna datos o lanza el error; el composable reacciona.
- Tipos compartidos con el backend RECOMENDADO en `shared/types/` (no importar nada de `server/` en el cliente).

## 4. Tiempo real (opcional)
- Si se usa Socket.io: un único singleton en `composables/core/useSocket.ts`; los stores se suscriben y actualizan su estado.
- Con pocos usuarios, refrescar al enfocar la pestaña o polling moderado es una alternativa válida y más simple.

# 🧪 Testing y Calidad

**Stack:** Vitest + `@nuxt/test-utils`.

## 1. Prioridades
1. **Domain (unitario, obligatorio):** reglas puras; rápidas y sin mocks.
2. **Services críticos (integración):** casos que mueven dinero, stock o permisos.
3. **Endpoints clave:** autenticación y autorización (un rol sin permiso recibe 403).
4. Frontend: composables y stores con lógica no trivial.

No se persigue 100% de cobertura; se exige cobertura de lo que puede causar pérdida de datos o dinero.

## 2. Domain
- `describe` / `it` / `expect`. Cubrir caso feliz y **edge cases**: vacíos, negativos, límites, cantidades mayores al stock, decimales.

## 3. Integración con base de datos
- PROHIBIDO mockear Prisma en tests de repository/service: usar PostgreSQL de pruebas real (Docker o BD dedicada).
- Cada test aislado: transacción con rollback o truncado entre tests.
- `DATABASE_URL` de test separada; nunca apuntar a producción.

## 4. Calidad estática
- `tsc --noEmit` y ESLint DEBEN pasar antes de commit (RECOMENDADO hook con `lint-staged`).

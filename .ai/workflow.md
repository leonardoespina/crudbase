# 🚦 Git y Flujo de Trabajo

## 1. Conventional Commits (obligatorio)
Formato: `tipo(scope): descripción en imperativo`
- `feat` nueva funcionalidad · `fix` corrección · `refactor` estructura sin cambio funcional
- `perf` rendimiento · `test` pruebas · `chore` dependencias/config · `docs` documentación
- Scope = módulo (`feat(inventory): ...`). El cuerpo explica el **por qué**.

## 2. Commits atómicos
- PROHIBIDO mezclar módulos no relacionados en un commit. Separar por dominio (ej: `auth` y `reports` → dos commits).
- Migraciones de Prisma van en el mismo commit que el cambio de schema que las origina.

## 3. Ramas
- `main` siempre desplegable. Trabajo en `feat/<tema>`, `fix/<tema>`.
- Antes de merge: tipos, lint y tests en verde.

## 4. Agente IA
- El agente NO hace `push`, `reset --hard` ni `force` sin autorización explícita.
- Antes de commitear, mostrar la agrupación propuesta de archivos y mensajes.

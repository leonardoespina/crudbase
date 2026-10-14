# 🤖 IA Local (Opcional)

> Aplica solo si `project.md` declara integración con LLM. Objetivo: IA **privada**, sin enviar datos a terceros.

## 1. Arquitectura
- **Puerto** en domain: `server/domain/ai/AiProvider.ts` (`chat()`, `embed()`).
- **Adaptador** en `server/services/ai/providers/ollama.ts` (o compatible OpenAI API local: llama.cpp, vLLM, LM Studio).
- **Casos de uso** en `server/services/ai/<caso>.ts`. Los handlers nunca llaman al proveedor directamente.
- URL y modelo por variables de entorno validadas (`AI_BASE_URL`, `AI_MODEL`). Cambiar de modelo no debe requerir cambios de código.

## 2. Reglas de seguridad
- La IA **sugiere, el humano confirma**. PROHIBIDO que la IA ejecute escrituras en BD de forma autónoma.
- Si se exponen herramientas (tool calling), solo de **lectura** y filtradas por los permisos del usuario que pregunta.
- El contexto enviado al modelo respeta RBAC y aislamiento por sede: nunca incluir datos que el usuario no podría ver.
- Tratar la salida del modelo como input no confiable: no ejecutarla, no renderizarla como HTML sin sanitizar.

## 3. RAG (consulta de documentos)
- Embeddings en PostgreSQL con `pgvector` (evita infraestructura adicional).
- Ingesta como proceso separado/manual, no en el request del usuario.
- Responder citando la fuente (documento/página).

## 4. Operación
- Timeout por request (ej: 60 s) y respuesta en streaming hacia el cliente.
- Cola simple / límite de concurrencia (ej: 1‑2 inferencias simultáneas) para no saturar el servidor.
- Si el proveedor no responde, el sistema sigue funcionando: la IA es una mejora, nunca una dependencia crítica.

## 5. Dimensionamiento orientativo
| Hardware | Modelos (cuantizados q4) |
|---|---|
| Solo CPU, 16 GB RAM | 3B (lento, respuestas cortas) |
| GPU 8 GB | 7‑8B |
| GPU 16‑24 GB | 14B‑27B |

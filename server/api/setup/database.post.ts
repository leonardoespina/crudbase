import { z } from 'zod'
import pg from 'pg'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { execSync } from 'child_process'
import { defineApiHandler } from '../../utils/handler'
import { reloadPrismaClient } from '../../utils/prisma'
import { ValidationError } from '../../domain/errors'
import { logger } from '../../utils/logger'

const schema = z.object({
  host: z.string().default('localhost'),
  port: z.coerce.number().default(5432),
  user: z.string().min(1, 'El usuario de PostgreSQL es requerido'),
  password: z.string().default(''),
  database: z
    .string()
    .min(1, 'El nombre de la base de datos es requerido')
    .regex(/^[a-zA-Z0-9_]+$/, 'El nombre de la base de datos solo puede contener letras, números y guiones bajos (_)')
})

export default defineApiHandler(async (event) => {
  const body = await readBody(event)
  const valid = schema.parse(body)

  logger.info(`🔌 Probando conexión a PostgreSQL en ${valid.host}:${valid.port}...`)

  // 1. Conectarse a la base de datos de mantenimiento 'postgres'
  const client = new pg.Client({
    host: valid.host,
    port: valid.port,
    user: valid.user,
    password: valid.password,
    database: 'postgres',
    connectionTimeoutMillis: 5000
  })

  try {
    await client.connect()
  } catch (error: any) {
    logger.error('❌ Error conectando a PostgreSQL:', error)
    throw new ValidationError(`No se pudo conectar a PostgreSQL: ${error.message}. Verifica el host, puerto, usuario y contraseña.`)
  }

  // 2. Comprobar si la base de datos ya existe, si no, crearla
  try {
    const checkDb = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [valid.database])

    if (checkDb.rows.length === 0) {
      logger.info(`📦 Creando base de datos '${valid.database}'...`)
      await client.query(`CREATE DATABASE "${valid.database.replace(/"/g, '""')}"`)
      logger.info(`✅ Base de datos '${valid.database}' creada con éxito.`)
    } else {
      logger.info(`ℹ️ La base de datos '${valid.database}' ya existía.`)
    }
  } catch (error: any) {
    logger.error('❌ Error al crear la base de datos:', error)
    throw new ValidationError(`Error al crear la base de datos: ${error.message}`)
  } finally {
    await client.end()
  }

  // 3. Construir DATABASE_URL segura
  const encodedUser = encodeURIComponent(valid.user)
  const encodedPass = encodeURIComponent(valid.password)
  const databaseUrl = `postgresql://${encodedUser}:${encodedPass}@${valid.host}:${valid.port}/${valid.database}?schema=public`

  // 4. Escribir o actualizar el archivo .env SOLO si no existe o cambió la conexión
  const envPath = path.join(process.cwd(), '.env')
  let currentEnv = ''
  if (fs.existsSync(envPath)) {
    try {
      currentEnv = fs.readFileSync(envPath, 'utf8')
    } catch {}
  }

  if (!currentEnv.includes(databaseUrl)) {
    const jwtSecret = crypto.randomBytes(32).toString('hex')
    const envContent = `# ── CONFIGURACIÓN DEL ENTORNO GENERADA POR ASISTENTE WEB ──
APP_NAME="CRUDBASE"
PORT=3000
NODE_ENV="development"
DATABASE_URL="${databaseUrl}"
JWT_SECRET="${jwtSecret}"
APP_TIMEZONE="America/Caracas"
COOKIE_SECURE="false"
`
    fs.writeFileSync(envPath, envContent, 'utf8')
    process.env.DATABASE_URL = databaseUrl
    process.env.JWT_SECRET = jwtSecret
    logger.info(`✅ Archivo .env generado exitosamente con la conexión a '${valid.database}'.`)
  } else {
    logger.info(`ℹ️ Archivo .env ya contiene la conexión a '${valid.database}', no se sobreescribió.`)
  }

  // 5. Reconectar Prisma a la nueva base de datos
  reloadPrismaClient(databaseUrl)

  // 6. Ejecutar 'prisma db push' para crear automáticamente todas las tablas
  try {
    logger.info('🚀 Ejecutando prisma db push para crear tablas en PostgreSQL...')
    execSync('npx prisma db push --skip-generate', {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'pipe'
    })
    logger.info('✅ Tablas creadas y sincronizadas exitosamente en PostgreSQL.')
  } catch (err: any) {
    logger.warn('Aviso durante prisma db push (continuando):', err.message)
  }

  return {
    success: true,
    database: valid.database,
    message: `Base de datos '${valid.database}' conectada, configurada en .env y tablas creadas exitosamente.`
  }
})

export interface LogAuditOptions {
  userId?: number | null
  action: string
  entity: string
  entityId?: number | null
  oldValues?: any
  newValues?: any
  details?: any
  ipAddress?: string
}

/**
 * Registra una acción inalterable en la bitácora de auditoría (AuditLog)
 * Acepta tanto el cliente base de Prisma como el contexto de transacción tx.
 */
export async function logAudit(tx: any, options: LogAuditOptions) {
  const details = options.details
    ? (typeof options.details === 'string' ? options.details : JSON.stringify(options.details))
    : JSON.stringify({
        before: options.oldValues,
        after: options.newValues
      })

  return tx.auditLog.create({
    data: {
      userId: options.userId || null,
      action: options.action,
      entity: options.entity,
      entityId: options.entityId || null,
      details,
      ip: options.ipAddress || null
    }
  })
}

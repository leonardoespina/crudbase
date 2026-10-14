import { AuditRepository } from '../repository/auditRepository'

export class AuditService {
  static async list(limit = 100, entity?: string) {
    return AuditRepository.findAll(limit, entity)
  }
}

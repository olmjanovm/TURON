"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class AuditService {
    /**
     * Records a data mutation in the audit log.
     */
    static async record(params) {
        try {
            await prisma.auditLog.create({
                data: {
                    userId: params.userId,
                    action: params.action,
                    entity: params.entity,
                    entityId: params.entityId,
                    oldValue: params.oldValue,
                    newValue: params.newValue,
                },
            });
        }
        catch (error) {
            // In production, we might want to log this but not fail the main request
            console.error('❌ Audit log failure:', error);
        }
    }
    static async recordStatusChange(params) {
        return this.record({
            ...params,
            action: 'STATUS_CHANGE',
            oldValue: { status: params.from },
            newValue: { status: params.to }
        });
    }
}
exports.AuditService = AuditService;
//# sourceMappingURL=audit.service.js.map
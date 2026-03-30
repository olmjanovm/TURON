export declare class AuditService {
    /**
     * Records a data mutation in the audit log.
     */
    static record(params: {
        userId?: string;
        action: string;
        entity: string;
        entityId: string;
        oldValue?: any;
        newValue?: any;
    }): Promise<void>;
    static recordStatusChange(params: {
        userId: string;
        entity: string;
        entityId: string;
        from: string;
        to: string;
    }): Promise<void>;
}
//# sourceMappingURL=audit.service.d.ts.map
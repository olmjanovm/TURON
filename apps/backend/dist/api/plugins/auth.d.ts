import { FastifyInstance } from 'fastify';
import { UserRoleEnum } from '@turon/shared';
declare const _default: (fastify: FastifyInstance) => Promise<void>;
export default _default;
declare module 'fastify' {
    interface FastifyInstance {
        authenticate: any;
        authorize: (allowedRoles: UserRoleEnum[]) => any;
    }
}
//# sourceMappingURL=auth.d.ts.map
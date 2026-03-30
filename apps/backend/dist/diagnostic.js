"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function check() {
    const user = await prisma.user.findFirst({
        include: { roles: true }
    });
    console.log('User roles found:', !!user?.roles);
}
check().catch(console.error);
//# sourceMappingURL=diagnostic.js.map
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Initiating Test Data Seed Configuration Loop...');

    // 1. Admin Bootstrapping (Map to your personal Telegram ID manually later if needed)
    const adminUser = await prisma.user.upsert({
        where: { telegramId: '999999991' },
        update: {},
        create: {
            telegramId: '999999991',
            name: 'Inspector Admin',
            phone: '+998901234567',
            language: 'uz',
            isAdmin: true,
            isCourier: false
        }
    });
    console.log('✅ Generated Sandbox Admin Context Node');

    // 2. Courier Bootstrapping
    const courierUser = await prisma.user.upsert({
        where: { telegramId: '999999992' },
        update: {},
        create: {
            telegramId: '999999992',
            name: 'Rapid Courier Test',
            phone: '+998901234568',
            language: 'uz',
            isAdmin: false,
            isCourier: true
        }
    });
    
    // Explicitly lock courier DB parameters gracefully cleanly natively
    await prisma.courier.upsert({
        where: { userId: courierUser.id },
        update: {},
        create: {
            userId: courierUser.id,
            status: 'AVAILABLE'
        }
    });
    console.log('✅ Generated Sandbox Courier Context Node');

    // 3. Promotional Engine Target
    await prisma.promoCode.upsert({
        where: { code: 'DEMO20' },
        update: {},
        create: {
            code: 'DEMO20',
            discountType: 'PERCENTAGE',
            discountValue: 20,
            minOrderValue: 20000,
            startDate: new Date(),
            endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
            usageLimit: 100,
            isActive: true
        }
    });
    console.log('✅ Injected Native Demo Promo Node [DEMO20]');

    console.log('🎉 Structural Sandbox Seed Terminated Successfully!');
}

main()
    .catch((e) => {
        console.error('Fatal Seed Frame Catch:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

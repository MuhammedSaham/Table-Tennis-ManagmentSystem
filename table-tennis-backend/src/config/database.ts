import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    log: process.env.DEBUG_SQL === 'true' ? ['query', 'info', 'warn', 'error'] : ['error', 'warn'],
});

export default prisma;
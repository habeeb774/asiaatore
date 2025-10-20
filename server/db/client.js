// server/db/client.js
import { PrismaClient } from '@prisma/client';
import pino from 'pino';

const logger = pino({ level: process.env.LOG_LEVEL || 'debug' });

// When ALLOW_INVALID_DB=true we should not crash the server.
// Instead, export a minimal stub that throws on DB usage so routes can detect degraded mode.
const ALLOW_DEGRADED = process.env.ALLOW_INVALID_DB === 'true';

function createDegradedPrismaStub(reason = 'Database disabled (ALLOW_INVALID_DB=true)') {
    const err = () => { const e = new Error(reason); e.code = 'DB_DISABLED'; throw e; };
    const asyncErr = async () => err();
    // Proxy to lazily throw on any model access or method call
    const handler = {
        get(_target, prop) {
            if (prop === '$connect' || prop === '$disconnect' || prop === '$on' || prop === '$transaction' || prop === '$queryRaw' || prop === '$executeRaw') return asyncErr;
            // Return a nested proxy so model operations like prisma.user.findMany() also throw
            return new Proxy({}, {
                get() { return asyncErr; }
            });
        },
        apply() { return asyncErr(); }
    };
    return new Proxy({}, handler);
}

let prisma;

try {
    if (ALLOW_DEGRADED) {
        logger.warn('[DB] ALLOW_INVALID_DB=true — running in degraded mode without DB connection');
        prisma = createDegradedPrismaStub('Degraded mode: DB disabled');
    } else if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL not set');
    } else {
        prisma = new PrismaClient({
            log: [
                { level: 'query', emit: 'event' },
                { level: 'error', emit: 'event' },
                { level: 'warn', emit: 'event' },
                { level: 'info', emit: 'event' }
            ]
        });

        prisma.$on('query', e => logger.debug({ query: e.query, params: e.params }, 'DB Query'));
        prisma.$on('error', e => logger.error(e, 'DB Error'));
        prisma.$on('warn', e => logger.warn(e, 'DB Warning'));
        prisma.$on('info', e => logger.info(e, 'DB Info'));

        await prisma.$connect();
        logger.info('[DB] Connected successfully');
    }
} catch (e) {
    if (ALLOW_DEGRADED) {
        logger.warn({ err: e, message: e?.message, code: e?.code }, '[DB] Connection failed — continuing in degraded mode');
        prisma = createDegradedPrismaStub(e?.message || 'DB connection failed');
    } else {
        logger.error(e, '[DB] Connection failed');
        process.exit(1);
    }
}

export default prisma;

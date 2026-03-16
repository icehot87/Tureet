import { PrismaClient } from '@prisma/client';

// #region agent log
const logPrisma = (location: string, message: string, data: any) => {
  const logEntry = {location,message,data,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'};
  console.log('[DEBUG]', logEntry);
  if (typeof fetch !== 'undefined') {
    fetch('http://127.0.0.1:7242/ingest/79064bf1-7670-47f6-a7ea-3ca1c8073e89',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logEntry)}).catch(()=>{});
  }
};
// #endregion

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// #region agent log
try {
  logPrisma('prisma.ts:17', 'Prisma initialization start', { 
    hasExistingPrisma: !!globalForPrisma.prisma, 
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    nodeEnv: process.env.NODE_ENV 
  });
} catch (e) {
  console.error('[ERROR] Failed to log Prisma initialization:', e);
}
// #endregion

// PrismaClient automatically reads DATABASE_URL from environment variables
// Works with both Prisma 5 and Prisma 7
export const prisma =
  globalForPrisma.prisma ??
  (() => {
    try {
      // #region agent log
      logPrisma('prisma.ts:15', 'Creating new PrismaClient', {});
      // #endregion
      const client = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      });
      // #region agent log
      logPrisma('prisma.ts:20', 'PrismaClient created successfully', {});
      // #endregion
      return client;
    } catch (error: any) {
      // #region agent log
      logPrisma('prisma.ts:23', 'PrismaClient creation error', { error: error?.message, stack: error?.stack });
      // #endregion
      throw error;
    }
  })();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

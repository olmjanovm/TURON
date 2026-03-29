const { session } = require('telegraf');

// Compatibility wrapper resolving internal imports defensively natively.
let sessionFn;
try {
  sessionFn = require('@telegraf/session').session || require('@telegraf/session');
} catch (error) {
  sessionFn = session;
}

function createSessionMiddleware() {
  const redisUrl = process.env.REDIS_URL;

  // 1. Strict pattern validation rules (Only accept valid TCP strings)
  const isValidRedisUrl = redisUrl && typeof redisUrl === 'string' && (redisUrl.startsWith('redis://') || redisUrl.startsWith('rediss://'));

  // 2. If completely missing, disabled, or an empty format:
  if (!isValidRedisUrl || redisUrl.toLowerCase() === 'disabled') {
    // We explicitly do NOT import or process ioredis natively at all
    console.log('Using in-memory session storage');
    
    // 3. Return native session module purely in memory cleanly 
    return sessionFn({
      getSessionKey: (ctx) => {
        if (ctx.from) return String(ctx.from.id);
        return undefined;
      }
    });
  }

  // Redis instantiation bounds (only triggers if strictly valid config is physically attached)
  let Redis;
  try {
      Redis = require('ioredis');
  } catch (e) {
      console.log('Using in-memory session storage');
      return sessionFn({
        getSessionKey: (ctx) => ctx.from ? String(ctx.from.id) : undefined
      });
  }

  let isRedisHealthy = false;
  let client;

  try {
    // 4. Safe instantiation blocking native infinite loops
    client = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      retryStrategy(times) {
        if (times > 1) {
          // Log exact 1 warning only and kill the re-connect spam immediately
          console.warn('⚠️ Redis connection failed. Falling back to in-memory session.');
          return null; // Forces IoRedis to completely sever polling requests
        }
        return 1000;
      }
    });

    client.on('connect', () => {
      isRedisHealthy = true;
      console.log('📡 Redis session storage dynamically connected');
    });

    client.on('error', (err) => {
      // Prevents excessive error bursts if bounds drop completely
      if (isRedisHealthy) {
          isRedisHealthy = false;
          console.warn('⚠️ Native Redis stream dropped gracefully falling back locally:', err.message);
      }
    });

  } catch (err) {
    console.warn('⚠️ Redis validation exception natively. Using in-memory fallback:', err.message);
    return sessionFn({
      getSessionKey: (ctx) => ctx.from ? String(ctx.from.id) : undefined
    });
  }

  // 5. Native memory cache serving gracefully dynamically mapped
  const fallbackStore = new Map();

  const store = {
    async get(key) {
      if (!isRedisHealthy) return fallbackStore.get(key);
      try {
        const value = await client.get(key);
        return value ? JSON.parse(value) : undefined;
      } catch (err) {
        return fallbackStore.get(key);
      }
    },
    async set(key, sessionState) {
      if (!isRedisHealthy) {
        if (sessionState == null) fallbackStore.delete(key);
        else fallbackStore.set(key, sessionState);
        return;
      }
      try {
        if (sessionState == null) {
          await client.del(key);
        } else {
          await client.set(key, JSON.stringify(sessionState));
        }
      } catch (err) {
        if (sessionState == null) fallbackStore.delete(key);
        else fallbackStore.set(key, sessionState);
      }
    },
    async delete(key) {
      if (!isRedisHealthy) {
        fallbackStore.delete(key);
        return;
      }
      try {
        await client.del(key);
      } catch (err) {
        fallbackStore.delete(key);
      }
    }
  };

  // 6. Export mapping standard telegraf configurations cleanly
  return sessionFn({
    store,
    getSessionKey: (ctx) => {
      if (ctx.from) return String(ctx.from.id);
      return undefined;
    }
  });
}

// 7. Output closure
module.exports = createSessionMiddleware;

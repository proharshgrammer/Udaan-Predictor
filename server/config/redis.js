const Redis = require('ioredis');

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  console.warn('REDIS_URL not set, Redis caching will be disabled.');
}

const redis = redisUrl ? new Redis(redisUrl, {
  // Upstash/Production Redis often requires TLS/SSL
  tls: redisUrl.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3
}) : null;

if (redis) {
  redis.on('connect', () => {
    console.log('Redis connected');
  });

  redis.on('error', (err) => {
    console.error('Redis connection error:', err);
  });
}

module.exports = redis;

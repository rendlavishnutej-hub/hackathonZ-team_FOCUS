import { Redis } from '@upstash/redis';

const redisClient = new Redis({
  url: 'https://proven-python-160555.upstash.io',
  token: 'gQAAAAAAAnMrAAIgcDJkODY5YWMzZWMyMWI0Nzc4YjZmMmMxZGQ5MTdiMGQ5Yg',
});

async function run() {
  console.log('Clearing all lockouts from Redis...');
  const keys = await redisClient.keys('lockout:*');
  if (keys.length > 0) {
    await redisClient.del(...keys);
    console.log(`Cleared ${keys.length} lockouts.`);
  } else {
    console.log('No lockouts found.');
  }
}

run().catch(console.error);

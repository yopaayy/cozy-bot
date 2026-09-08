import dns from 'dns';
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '1.0.0.1']);
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {
  // Ignore if not supported in environment
}

import { CozyClient } from './bot/client';
import { loadCommands } from './bot/handlers/command-handler';
import { loadEvents } from './bot/handlers/event-handler';
import { createApiServer } from './api/server';
import { config } from './shared/config';
import { logger } from './shared/logger';
import { prisma } from './shared/database';

async function bootstrap() {
  logger.info('=============================================');
  logger.info('  Starting Cozy Bot + API System 🤍');
  logger.info(`  Node Env: ${config.NODE_ENV}`);
  logger.info(`  Guild ID: ${config.GUILD_ID}`);
  logger.info('=============================================');

  // 1. Initialize Prisma Database Connection with retry
  let retries = 3;
  while (retries > 0) {
    try {
      await prisma.$connect();
      logger.info('[Database] Connected to MySQL successfully.');
      break;
    } catch (dbError) {
      retries--;
      if (retries === 0) {
        logger.error({ err: dbError }, '[Database] Failed to connect to MySQL database:');
      } else {
        logger.warn(`[Database] Connection attempt failed, retrying in 2s... (${retries} attempts left)`);
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }

  // 2. Initialize Discord Client
  const client = new CozyClient();

  // 3. Load Handlers
  await loadCommands(client);
  await loadEvents(client);

  // 4. Start Fastify API Server
  const fastify = await createApiServer(client);
  try {
    await fastify.listen({
      port: config.SERVER_PORT,
      host: config.SERVER_IP,
    });
    logger.info(`[API] Server listening on http://${config.SERVER_IP}:${config.SERVER_PORT}`);
  } catch (apiErr) {
    logger.error({ err: apiErr }, `[API] Failed to start Fastify server on port ${config.SERVER_PORT}:`);
  }

  // 5. Login Bot to Discord
  try {
    logger.info('[Bot] Logging into Discord...');
    await client.login(config.DISCORD_TOKEN);
    logger.info('[Bot] Discord login initiated.');
  } catch (loginErr) {
    logger.error({ err: loginErr }, '[Bot] Failed to login to Discord:');
  }

  // 6. Graceful Shutdown Handlers
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    try {
      await client.destroy();
      logger.info('[Bot] Discord client destroyed.');
    } catch (e) {
      logger.error({ err: e }, 'Error destroying Discord client:');
    }

    try {
      await fastify.close();
      logger.info('[API] Fastify server closed.');
    } catch (e) {
      logger.error({ err: e }, 'Error closing Fastify server:');
    }

    try {
      await prisma.$disconnect();
      logger.info('[Database] Prisma disconnected.');
    } catch (e) {
      logger.error({ err: e }, 'Error disconnecting Prisma:');
    }

    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  process.on('unhandledRejection', (reason, promise) => {
    logger.error({ reason, promise }, 'Unhandled Rejection');
  });

  process.on('uncaughtException', (error) => {
    logger.error({ err: error }, 'Uncaught Exception:');
  });
}

bootstrap().catch((err) => {
  logger.fatal({ err }, 'Bootstrap failed fatal error:');
  process.exit(1);
});

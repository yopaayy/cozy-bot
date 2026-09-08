// src/index.ts
// Main entry point: Bot + Fastify API in a single Node.js process
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

  // 1. Initialize Prisma Database Connection
  try {
    await prisma.$connect();
    logger.info('[Database] Connected to MySQL successfully.');
  } catch (dbError) {
    logger.error({ err: dbError }, '[Database] Failed to connect to MySQL database:');
    // Don't crash immediately; allow bot to log error and retry or continue
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

  // 5. Login Bot to Discord with clean retry
  const maxRetries = 5;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(`[Bot] Logging into Discord (attempt ${attempt}/${maxRetries})...`);
      await client.login(config.DISCORD_TOKEN);
      logger.info('[Bot] Discord login initiated.');
      break;
    } catch (loginErr) {
      logger.error({ err: loginErr }, `[Bot] Login attempt ${attempt}/${maxRetries} failed:`);
      if (attempt < maxRetries) {
        await client.destroy().catch(() => {});
        await new Promise((res) => setTimeout(res, 5000));
      }
    }
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

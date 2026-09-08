// src/api/server.ts
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import path from 'path';
import fs from 'fs';
import { config } from '../shared/config';
import { logger } from '../shared/logger';
import type { CozyClient } from '../bot/client';

export async function createApiServer(botClient?: CozyClient) {
  const fastify = Fastify({
    logger: false, // We use shared pino logger
  });

  // CORS
  await fastify.register(cors, {
    origin: true,
    credentials: true,
  });

  // Rate Limiting
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // JWT
  await fastify.register(jwt, {
    secret: config.JWT_SECRET,
  });

  // Static files for dashboard (if dashboard-out exists)
  const dashboardDistPath = path.join(process.cwd(), 'dashboard-out');
  if (fs.existsSync(dashboardDistPath)) {
    await fastify.register(fastifyStatic, {
      root: dashboardDistPath,
      prefix: '/',
    });
    logger.info(`[API] Serving static dashboard files from ${dashboardDistPath}`);
  } else {
    // Basic root route if dashboard hasn't been built yet
    fastify.get('/', async (req, reply) => {
      return reply.send({
        name: 'Cozy Bot & API',
        status: 'running',
        message: 'Cozy Dashboard build not found in dashboard-out/. API is ready.',
      });
    });
  }

  // Register API Routes
  const { verifyRoutes } = await import('./routes/verify.routes');
  await fastify.register(verifyRoutes, { botClient });

  // Health check endpoint
  fastify.get('/api/v1/health', async (req, reply) => {
    return reply.send({
      success: true,
      status: 'healthy',
      botReady: botClient?.isReady() ?? false,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  return fastify;
}

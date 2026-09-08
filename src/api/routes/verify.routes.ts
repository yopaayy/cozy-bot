// src/api/routes/verify.routes.ts
import { FastifyInstance } from 'fastify';
import { verificationService } from '../../bot/modules/verification/verification.service';
import { config } from '../../shared/config';
import type { CozyClient } from '../../bot/client';

export async function verifyRoutes(fastify: FastifyInstance, options: { botClient?: CozyClient }) {
  // GET current verify config
  fastify.get('/api/v1/config/verify', async (req, reply) => {
    const data = await verificationService.getConfig(config.GUILD_ID);
    return reply.send({ success: true, data });
  });

  // PATCH update verify config
  fastify.patch('/api/v1/config/verify', async (req, reply) => {
    const body = req.body as any;
    await verificationService.updateConfig(config.GUILD_ID, body);
    const updated = await verificationService.getConfig(config.GUILD_ID);
    return reply.send({ success: true, data: updated });
  });
}

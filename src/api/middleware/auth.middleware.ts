// src/api/middleware/auth.middleware.ts
import { FastifyRequest, FastifyReply } from 'fastify';

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    return reply.status(401).send({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Autentikasi token tidak valid atau telah kedaluwarsa.',
      },
    });
  }
}

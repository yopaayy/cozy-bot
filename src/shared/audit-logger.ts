// src/shared/audit-logger.ts
import { prisma } from './database';
import { logger } from './logger';

export interface AuditLogPayload {
  actorDiscordId: string;
  action: string;
  detail?: Record<string, unknown> | null;
  source: 'discord_bot' | 'dashboard' | 'system';
}

export async function logAudit(payload: AuditLogPayload): Promise<void> {
  try {
    if ((prisma as any).auditLog) {
      await (prisma as any).auditLog.create({
        data: {
          actorDiscordId: payload.actorDiscordId,
          action: payload.action,
          detail: payload.detail ? JSON.stringify(payload.detail) : null,
          source: payload.source,
        },
      });
    }
    logger.info(
      { detail: payload.detail },
      `[AuditLog] [${payload.source}] ${payload.action} by ${payload.actorDiscordId}`,
    );
  } catch (err) {
    logger.error({ err }, '[AuditLog] Failed to record audit log');
  }
}

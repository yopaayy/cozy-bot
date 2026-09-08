// src/bot/modules/verification/verification.service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verificationService } from './verification.service';
import { prisma } from '../../../shared/database';

vi.mock('../../../shared/database', () => ({
  prisma: {
    guildConfig: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    users: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    $transaction: vi.fn((promises) => Promise.all(promises)),
  },
}));

describe('VerificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should get default config when no db record exists', async () => {
    (prisma.guildConfig.findUnique as any).mockResolvedValue(null);

    const config = await verificationService.getConfig('123456789');
    expect(config.emoji).toBe('✅');
    expect(config.channelId).toBeNull();
  });

  it('should return existing config from db', async () => {
    (prisma.guildConfig.findUnique as any).mockResolvedValue({
      guildId: '123456789',
      verifyChannelId: 'channel-1',
      verifyEmoji: '🤍',
      unverifiedRoleId: 'role-unverified',
      verifiedRoleId: 'role-verified',
      verifyMessageId: 'msg-1',
    });

    const config = await verificationService.getConfig('123456789');
    expect(config.channelId).toBe('channel-1');
    expect(config.emoji).toBe('🤍');
    expect(config.unverifiedRoleId).toBe('role-unverified');
    expect(config.verifiedRoleId).toBe('role-verified');
  });
});

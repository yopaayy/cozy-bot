// src/bot/modules/verification/verification.types.ts

export interface VerificationConfig {
  channelId?: string | null;
  emoji: string;
  messageId?: string | null;
  unverifiedRoleId?: string | null;
  verifiedRoleId?: string | null;
}

export interface VerifyMemberResult {
  alreadyVerified: boolean;
  success: boolean;
  message: string;
}

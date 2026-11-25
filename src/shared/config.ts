// src/shared/config.ts
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  DISCORD_TOKEN: z.string().min(1, 'DISCORD_TOKEN wajib diisi'),
  DISCORD_CLIENT_ID: z.string().min(1, 'DISCORD_CLIENT_ID wajib diisi'),
  GUILD_ID: z.string().min(1, 'GUILD_ID wajib diisi'),

  // Roles
  OWNER_ROLE_ID: z.string().optional().default(''),
  OWNER_ID: z.string().optional().default(''),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL wajib diisi'),

  // Optional
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Environment validation failed:');
  for (const issue of parsed.error.issues) {
    console.error(` - ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

export const config = parsed.data;
export type Config = z.infer<typeof envSchema>;

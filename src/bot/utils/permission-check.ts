// src/bot/utils/permission-check.ts
import { GuildMember, PermissionFlagsBits } from 'discord.js';
import { config } from '../../shared/config';

export function isOwner(member: GuildMember): boolean {
  if (config.OWNER_ID && member.id === config.OWNER_ID) {
    return true;
  }
  if (config.OWNER_ROLE_ID && member.roles.cache.has(config.OWNER_ROLE_ID)) {
    return true;
  }
  return false;
}

export function isAdmin(member: GuildMember): boolean {
  if (isOwner(member)) return true;
  return member.permissions.has(PermissionFlagsBits.Administrator);
}

export function isStaff(member: GuildMember): boolean {
  if (isAdmin(member)) return true;
  return (
    member.permissions.has(PermissionFlagsBits.ManageGuild) ||
    member.permissions.has(PermissionFlagsBits.ManageMessages)
  );
}

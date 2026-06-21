// =========================================================================================================
// Discord Server Settings
// =========================================================================================================
// Canonical keys for the per-server settings stored in D1. Centralized so command code and the D1
// service never hardcode the raw string keys.

// =========================================================================================================
// Constants
// =========================================================================================================

export const DISCORD_SERVER_SETTINGS = {
  VERIFICATION_ROLE: "verification_role",
  VERIFICATION_PLUS_ROLE: "verification_plus_role",
  VERIFICATION_CHANNEL: "verification_channel",
  AUTO_NICKNAME: "auto_nickname",
  LOG_CHANNEL: "log_channel",
} as const;

// =========================================================================================================
// Types
// =========================================================================================================

export type DiscordServerSettingKey =
  (typeof DISCORD_SERVER_SETTINGS)[keyof typeof DISCORD_SERVER_SETTINGS];

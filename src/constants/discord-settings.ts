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
  WELCOME_PANEL_CHANNEL: "welcome_panel_channel",
  WELCOME_PANEL_MESSAGE: "welcome_panel_message",
  WELCOME_PANEL_LANGUAGE: "welcome_panel_language",
  WELCOME_PING_ENABLED: "welcome_ping_enabled",
} as const;

// The kind of input a setting accepts. Drives how `/settings set` groups its choices (each group keeps
// the native Discord picker for its type) and how `/settings view` renders the stored value.
export const SETTING_TYPE = {
  ROLE: "role",
  CHANNEL: "channel",
  TOGGLE: "toggle",
} as const;

// Settings a server manager edits through `/settings set`. `WELCOME_PANEL_MESSAGE` (the published panel's
// message id, written by the bot) and `WELCOME_PANEL_LANGUAGE` (chosen when publishing, via
// `/welcomepanel send language:`) are intentionally absent: neither is a role/channel/toggle picker.
export const SETTING_METADATA = [
  { key: DISCORD_SERVER_SETTINGS.VERIFICATION_ROLE, type: SETTING_TYPE.ROLE },
  { key: DISCORD_SERVER_SETTINGS.VERIFICATION_PLUS_ROLE, type: SETTING_TYPE.ROLE },
  { key: DISCORD_SERVER_SETTINGS.LOG_CHANNEL, type: SETTING_TYPE.CHANNEL },
  { key: DISCORD_SERVER_SETTINGS.WELCOME_PANEL_CHANNEL, type: SETTING_TYPE.CHANNEL },
  { key: DISCORD_SERVER_SETTINGS.AUTO_NICKNAME, type: SETTING_TYPE.TOGGLE },
  { key: DISCORD_SERVER_SETTINGS.WELCOME_PING_ENABLED, type: SETTING_TYPE.TOGGLE },
] as const;

// =========================================================================================================
// Types
// =========================================================================================================

export type DiscordServerSettingKey =
  (typeof DISCORD_SERVER_SETTINGS)[keyof typeof DISCORD_SERVER_SETTINGS];

export type SettingType = (typeof SETTING_TYPE)[keyof typeof SETTING_TYPE];

export type SettingMetadata = (typeof SETTING_METADATA)[number];

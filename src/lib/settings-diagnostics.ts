// =========================================================================================================
// Settings Diagnostics
// =========================================================================================================
// Live validation of a server's configuration: for every setting that is set, it checks whether the bot
// can actually act on it *before* the triggering event happens (a role grant, a channel send, a nickname
// change). This surfaces the invisible failures — "the role is configured but my role sits below it", "the
// log channel exists but I can't send there", "the welcome ping is on but no panel channel is set" — that
// otherwise only appear as a runtime 50013 when a member joins or runs `/sync`. `/settings view` renders
// the returned list. Pure inspection: it never mutates roles, channels or config.

// =========================================================================================================
// Imports
// =========================================================================================================

import { ChannelType, PermissionsBitField } from "discord.js";
import type { Guild, GuildMember } from "discord.js";

import { DISCORD_SERVER_SETTINGS } from "../constants/discord-settings.js";

// =========================================================================================================
// Constants
// =========================================================================================================

// A stored value of "0" (or empty) means the setting is unset; those are skipped rather than diagnosed.
const UNSET_VALUE = "0";
const TOGGLE_ENABLED = "1";

// =========================================================================================================
// Types
// =========================================================================================================

/** Severity of a diagnostic. `error` = will fail when its event fires; `warn` = misconfigured but harmless. */
export type DiagnosticLevel = "error" | "warn";

/** A single finding: which setting it concerns, how bad it is, and the localized message describing it. */
export interface Diagnostic {
  key: string;
  level: DiagnosticLevel;
  message: string;
}

/**
 * The localized strings the diagnostics need. The caller (`/settings view`) passes its own table; keys use
 * the `diag.` prefix so they don't collide with the command's existing phrases. Each message is a template
 * with `{role}` / `{channel}` placeholders the builder fills in.
 */
export interface DiagnosticPhrases {
  "diag.role_missing": string;
  "diag.no_manage_roles": string;
  "diag.role_hierarchy": string;
  "diag.channel_missing": string;
  "diag.channel_not_text": string;
  "diag.channel_no_view": string;
  "diag.channel_no_send": string;
  "diag.no_manage_nicknames": string;
  "diag.ping_without_panel": string;
}

// =========================================================================================================
// Helpers
// =========================================================================================================

/** Whether a stored setting value is present (a real id/flag, not the unset sentinel). */
function isSet(value: string | undefined): value is string {
  return value !== undefined && value !== "" && value !== UNSET_VALUE;
}

/**
 * Diagnoses a role-type setting: the role must still exist, the bot must have Manage Roles, and the bot's
 * top role must sit above the target — the exact preconditions `grantRole` in `sync-member.ts` enforces at
 * runtime. Returns the first blocking finding, or null when the bot could grant the role today.
 */
function diagnoseRole(
  key: string,
  roleId: string,
  guild: Guild,
  botMember: GuildMember,
  phrases: DiagnosticPhrases,
): Diagnostic | null {
  const role = guild.roles.cache.get(roleId);
  if (!role) {
    return { key, level: "error", message: phrases["diag.role_missing"] };
  }

  if (!botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
    return { key, level: "error", message: phrases["diag.no_manage_roles"] };
  }

  if (botMember.roles.highest.position <= role.position) {
    return {
      key,
      level: "error",
      message: phrases["diag.role_hierarchy"].replace("{role}", role.toString()),
    };
  }

  return null;
}

/**
 * Diagnoses a channel-type setting: the channel must exist, be a text/announcement channel, and the bot
 * must be able to view and send in it — the same pre-flight `resolvePanelChannel` runs before publishing.
 * Returns the first blocking finding, or null when the bot could post there today.
 */
function diagnoseChannel(
  key: string,
  channelId: string,
  guild: Guild,
  botMember: GuildMember,
  phrases: DiagnosticPhrases,
): Diagnostic | null {
  const channel = guild.channels.cache.get(channelId);
  if (!channel) {
    return { key, level: "error", message: phrases["diag.channel_missing"] };
  }

  if (channel.type !== ChannelType.GuildText && channel.type !== ChannelType.GuildAnnouncement) {
    return { key, level: "error", message: phrases["diag.channel_not_text"] };
  }

  const perms = channel.permissionsFor(botMember);
  if (!perms?.has(PermissionsBitField.Flags.ViewChannel)) {
    return { key, level: "error", message: phrases["diag.channel_no_view"] };
  }
  if (!perms.has(PermissionsBitField.Flags.SendMessages)) {
    return { key, level: "error", message: phrases["diag.channel_no_send"] };
  }

  return null;
}

// =========================================================================================================
// Main
// =========================================================================================================

/**
 * Inspects a server's stored settings against the guild's live state and the bot's permissions, returning
 * the problems the bot would hit when the relevant event fires. Only settings that are actually set are
 * diagnosed. Errors come first, then warnings; an empty array means everything configured is actionable.
 *
 * The caller resolves the bot member once (`guild.members.fetchMe()`) and passes it in so a single view
 * doesn't fetch it repeatedly.
 */
export function diagnoseSettings(
  guild: Guild,
  botMember: GuildMember,
  settings: Record<string, string>,
  phrases: DiagnosticPhrases,
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  // Role settings: both are granted through the same `grantRole` path, so they share the role pre-flight.
  const roleKeys = [
    DISCORD_SERVER_SETTINGS.VERIFICATION_ROLE,
    DISCORD_SERVER_SETTINGS.VERIFICATION_PLUS_ROLE,
  ];
  for (const key of roleKeys) {
    const value = settings[key];
    if (isSet(value)) {
      const finding = diagnoseRole(key, value, guild, botMember, phrases);
      if (finding) {
        diagnostics.push(finding);
      }
    }
  }

  // Channel settings: every one is a target the bot sends messages to.
  const channelKeys = [
    DISCORD_SERVER_SETTINGS.LOG_CHANNEL,
    DISCORD_SERVER_SETTINGS.WELCOME_PANEL_CHANNEL,
    DISCORD_SERVER_SETTINGS.PROFILE_SEND_CHANNEL,
  ];
  for (const key of channelKeys) {
    const value = settings[key];
    if (isSet(value)) {
      const finding = diagnoseChannel(key, value, guild, botMember, phrases);
      if (finding) {
        diagnostics.push(finding);
      }
    }
  }

  // Auto-nickname needs Manage Nicknames; the per-member hierarchy is checked at rename time (it varies by
  // member), so here we only flag the missing permission, which blocks every rename regardless of member.
  if (settings[DISCORD_SERVER_SETTINGS.AUTO_NICKNAME] === TOGGLE_ENABLED) {
    if (!botMember.permissions.has(PermissionsBitField.Flags.ManageNicknames)) {
      diagnostics.push({
        key: DISCORD_SERVER_SETTINGS.AUTO_NICKNAME,
        level: "warn",
        message: phrases["diag.no_manage_nicknames"],
      });
    }
  }

  // Cross-setting consistency: the welcome ping does nothing without a panel channel to ping in. This is
  // exactly the silent no-op `guildMemberAdd` reports only once a member joins — surfaced here up front.
  if (settings[DISCORD_SERVER_SETTINGS.WELCOME_PING_ENABLED] === TOGGLE_ENABLED) {
    if (!isSet(settings[DISCORD_SERVER_SETTINGS.WELCOME_PANEL_CHANNEL])) {
      diagnostics.push({
        key: DISCORD_SERVER_SETTINGS.WELCOME_PING_ENABLED,
        level: "warn",
        message: phrases["diag.ping_without_panel"],
      });
    }
  }

  // Errors first so the most urgent problems lead the report.
  return diagnostics.sort((a, b) => (a.level === b.level ? 0 : a.level === "error" ? -1 : 1));
}

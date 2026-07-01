// =========================================================================================================
// Guild Member Add Event
// =========================================================================================================
// Runs when a new member joins. If the welcome ping is enabled and a panel channel is configured, it
// pings the member in that channel to pull their attention toward the static onboarding panel, then
// deletes the ping shortly after so the channel doesn't fill up with mentions. While there, it self-heals
// the panel: if the recorded panel message no longer exists, it re-publishes one and updates the config.
// Separately, if a profile-send channel is configured and the joining member is already verified
// (verification is global across servers), it posts that member's VRChat profile there so staff can see
// exactly who joined, using the shared profile renderer. All failures (channel gone, permissions revoked)
// are reported to the configured log channel, or to stdout as a last resort, and never crash the gateway.

// =========================================================================================================
// Imports
// =========================================================================================================

import { MessageFlags, PermissionsBitField } from "discord.js";
import type { GuildMember, GuildTextBasedChannel } from "discord.js";

import { DISCORD_SERVER_SETTINGS } from "../constants/discord-settings.js";
import { printMessage } from "../lib/logger.js";
import { D1Class } from "../services/d1.js";
import { buildProfileContainer } from "../ui/profile-message.js";
import { publishWelcomePanel, resolvePanelChannel, resolvePanelLocale } from "../ui/welcome-panel.js";
import type { UserRequestData } from "../types/models.js";

// =========================================================================================================
// Constants
// =========================================================================================================

const PING_ENABLED = "1";

// How long the attention-grabbing ping stays before it is deleted. Long enough to notify, short enough
// to keep the panel channel clean.
const PING_LIFETIME_MS = 8_000;

// =========================================================================================================
// Helpers
// =========================================================================================================

/**
 * Reports a post-configuration failure to the server's log channel when one is configured and reachable,
 * otherwise to stdout. Never throws: a logging failure must not take down the join handler.
 */
async function reportIssue(
  member: GuildMember,
  settings: Record<string, string>,
  message: string,
): Promise<void> {
  printMessage(`[welcome] ${member.guild.name} (${member.guild.id}): ${message}`);

  const logChannelId = settings[DISCORD_SERVER_SETTINGS.LOG_CHANNEL];
  if (!logChannelId || logChannelId === "0") {
    return;
  }

  const logChannel = member.guild.channels.cache.get(logChannelId);
  if (!logChannel?.isTextBased()) {
    return;
  }

  const botMember = await member.guild.members.fetchMe().catch(() => null);
  if (!botMember) {
    return;
  }
  const perms = logChannel.permissionsFor(botMember);
  if (!perms?.has(PermissionsBitField.Flags.SendMessages)) {
    return;
  }

  await logChannel.send({ content: `⚠️ Welcome panel: ${message}` }).catch(() => undefined);
}

/**
 * Ensures the recorded panel message still exists; if it was deleted, re-publishes a fresh panel and
 * persists the new message id so the panel keeps existing without manual intervention.
 */
async function ensurePanel(
  member: GuildMember,
  channel: GuildTextBasedChannel,
  settings: Record<string, string>,
  requestData: UserRequestData,
): Promise<void> {
  const messageId = settings[DISCORD_SERVER_SETTINGS.WELCOME_PANEL_MESSAGE];
  if (messageId && messageId !== "0") {
    const existing = await channel.messages.fetch(messageId).catch(() => null);
    if (existing) {
      return;
    }
  }

  const locale = resolvePanelLocale(
    settings[DISCORD_SERVER_SETTINGS.WELCOME_PANEL_LANGUAGE],
    member.guild,
  );
  const newId = await publishWelcomePanel(member.guild, channel, locale);
  if (newId) {
    await D1Class.updateDiscordSetting(
      requestData,
      member.guild.id,
      DISCORD_SERVER_SETTINGS.WELCOME_PANEL_MESSAGE,
      newId,
    ).catch(() => undefined);
  }
}

/**
 * Runs the welcome-panel flow: when the ping is enabled and a panel channel is set, self-heals the panel
 * and pings the new member toward it, auto-deleting the ping shortly after. Skips silently when the ping
 * is disabled; reports channel/permission problems through `reportIssue`. Never throws.
 */
async function handleWelcomePanel(
  member: GuildMember,
  settings: Record<string, string>,
  requestData: UserRequestData,
): Promise<void> {
  if (settings[DISCORD_SERVER_SETTINGS.WELCOME_PING_ENABLED] !== PING_ENABLED) {
    return;
  }

  const channelId = settings[DISCORD_SERVER_SETTINGS.WELCOME_PANEL_CHANNEL];
  if (!channelId || channelId === "0") {
    await reportIssue(member, settings, "ping is enabled but no panel channel is set.");
    return;
  }

  const check = await resolvePanelChannel(member.guild, channelId);
  if (!check.ok) {
    await reportIssue(member, settings, `cannot use the panel channel (${check.issue}).`);
    return;
  }

  // Self-heal the panel before pinging, so the member who follows the ping always finds a live panel.
  await ensurePanel(member, check.channel, settings, requestData);

  const ping = await check.channel
    .send({ content: `<@${member.id}>`, flags: MessageFlags.SuppressNotifications })
    .catch(() => null);

  // Auto-delete the ping so the channel stays clean; ignore if it was already removed.
  if (ping) {
    setTimeout(() => void ping.delete().catch(() => undefined), PING_LIFETIME_MS);
  }
}

/**
 * Posts the joining member's VRChat profile to the configured profile-send channel when the member is
 * already verified (verification is global, so a member linked in another server has a profile here too).
 * Silently skips when the setting is unset or the member has no profile; channel/permission problems are
 * reported through `reportIssue`. Never throws.
 */
async function sendProfile(
  member: GuildMember,
  settings: Record<string, string>,
  requestData: UserRequestData,
): Promise<void> {
  const channelId = settings[DISCORD_SERVER_SETTINGS.PROFILE_SEND_CHANNEL];
  if (!channelId || channelId === "0") {
    return;
  }

  const container = await buildProfileContainer(requestData, member.id);
  // Not verified anywhere (or VRChat lookup failed): nothing to post, and this is the common case for a
  // brand-new member, so it is not an error worth reporting.
  if (!container) {
    return;
  }

  const check = await resolvePanelChannel(member.guild, channelId);
  if (!check.ok) {
    await reportIssue(member, settings, `cannot use the profile-send channel (${check.issue}).`);
    return;
  }

  await check.channel
    .send({
      components: [container],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.SuppressNotifications,
    })
    .catch(() => undefined);
}

// =========================================================================================================
// Main
// =========================================================================================================

/**
 * Handles the GuildMemberAdd event: pings the new member toward the welcome panel (if enabled),
 * self-heals the panel, and posts the member's VRChat profile to the profile-send channel when verified.
 * Bots are ignored. Everything is wrapped so a failure can't crash the gateway.
 */
export async function onGuildMemberAdd(member: GuildMember): Promise<void> {
  if (member.user.bot) {
    return;
  }

  const requestData: UserRequestData = {
    discord_id: member.client.user.id,
    discord_name: member.client.user.username,
  };

  let settings: Record<string, string>;
  try {
    settings = await D1Class.getAllDiscordSettings(requestData, member.guild.id);
  } catch (error) {
    printMessage(`[welcome] failed to load settings for ${member.guild.id}:`, String(error));
    return;
  }

  // The two features are independent settings, so run each regardless of whether the other is configured.
  await handleWelcomePanel(member, settings, requestData);
  await sendProfile(member, settings, requestData);
}

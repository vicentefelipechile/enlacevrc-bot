// =========================================================================================================
// Guild Create Event
// =========================================================================================================
// Runs when the bot is added to a new server. Registers the server in the database (idempotently),
// attributing the request to whoever invited the bot. The inviter is resolved from the audit log;
// if that lookup fails we fall back to the bot's own identity so registration still proceeds.

// =========================================================================================================
// Imports
// =========================================================================================================

import { AuditLogEvent } from "discord.js";
import type { Guild } from "discord.js";

import { D1Class } from "../services/d1.js";
import { printMessage } from "../lib/logger.js";
import type { UserRequestData } from "../types/models.js";

// =========================================================================================================
// Main
// =========================================================================================================

/**
 * Handles the GuildCreate event: adds the new server to the database if it isn't already there.
 * Errors are logged and swallowed so a transient API failure doesn't crash the gateway connection.
 */
export async function onGuildCreate(guild: Guild): Promise<void> {
  const serverId = guild.id;
  const serverName = guild.name;
  const botUser = guild.client.user;

  // Find who invited the bot via the audit log; fall back to the bot itself if unavailable.
  const fetchedLogs = await guild
    .fetchAuditLogs({ limit: 1, type: AuditLogEvent.BotAdd })
    .catch(() => null);
  const botEntry = fetchedLogs?.entries.find((entry) => entry.target?.id === botUser.id);
  const inviter = botEntry?.executor ?? botUser;

  const userRequestData: UserRequestData = {
    discord_id: inviter.id,
    discord_name: inviter.username ?? botUser.username,
  };

  printMessage(`Joined new guild: ${serverName} (${serverId})`);

  try {
    const exists = await D1Class.discordServerExists(userRequestData, serverId);
    if (exists) {
      printMessage(`Server ${serverName} (${serverId}) already exists in the database. Skipping.`);
      return;
    }

    printMessage(`Adding server ${serverName} (${serverId}) to the database...`);
    await D1Class.addDiscordServer(userRequestData, serverId, serverName);
    printMessage(`Successfully added server ${serverName} (${serverId}) to the database.`);
  } catch (error) {
    console.error(`Error handling guildCreate for ${serverName} (${serverId}):`, error);
  }
}

// =========================================================================================================
// Ready Event
// =========================================================================================================
// Runs once when the gateway connection is ready. Signs in to VRChat and warms the per-guild VRChat
// group cache the `group` command's autocomplete reads from, so the first autocomplete after startup
// is instant instead of hitting the worker.

// =========================================================================================================
// Imports
// =========================================================================================================

import type { Client } from "discord.js";

import { D1Class } from "../services/d1.js";
import { signIn } from "../services/vrchat.js";
import { printMessage } from "../lib/logger.js";
import type { BotClient } from "../types/client.js";
import type { UserRequestData } from "../types/models.js";

// =========================================================================================================
// Main
// =========================================================================================================

/**
 * Handles the ClientReady event: confirms login, signs in to VRChat, and populates the VRChat group
 * cache for every server the bot is registered in. Failures while caching one server are logged and
 * skipped so a single bad server can't abort startup.
 */
export async function onClientReady(client: Client<true>): Promise<void> {
  const botClient = client as BotClient;

  printMessage(`Logged in as ${client.user.tag}`);
  await signIn();

  const userRequestData: UserRequestData = {
    discord_id: client.user.id,
    discord_name: client.user.username,
  };

  const discordServers = await D1Class.listDiscordServers(userRequestData);

  for (const server of discordServers) {
    try {
      const groups = await D1Class.listVRChatGroups(userRequestData, server.discord_server_id);
      botClient.vrchatGroups.set(server.discord_server_id, groups);
    } catch (error) {
      // Bug fix: the original seeded every entry with [] first; here we just skip and leave the
      // server out of the cache so autocomplete can guard on a missing key instead of an empty array.
      console.error(`Failed to cache VRChat groups for server ${server.discord_server_id}:`, error);
    }
  }

  printMessage(`Cached VRChat groups for ${botClient.vrchatGroups.size} server(s)`);
}

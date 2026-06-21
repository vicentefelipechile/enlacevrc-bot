// =========================================================================================================
// Client Types
// =========================================================================================================
// Augments the discord.js Client with the bot-specific collections we attach at startup: the command
// registry and the per-guild VRChat group cache used by the `group` command's autocomplete.

import type { Client, Collection } from "discord.js";

import type { VRChatGroup } from "./models.js";
import type { Command } from "../commands/types.js";

// =========================================================================================================
// Types
// =========================================================================================================

/** A discord.js Client carrying the bot's command registry and cached VRChat groups per guild. */
export interface BotClient extends Client {
  commands: Collection<string, Command>;
  vrchatGroups: Collection<string, VRChatGroup[]>;
}

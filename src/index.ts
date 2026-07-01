// =========================================================================================================
// Entry Point
// =========================================================================================================
// Boots the bot: initializes the D1 client, builds the Discord client with the command and group
// caches, registers commands and event handlers, logs in, and installs graceful-shutdown handlers.

// =========================================================================================================
// Imports
// =========================================================================================================

import { Client, Collection, Events, GatewayIntentBits } from "discord.js";

import { allCommands } from "./commands/index.js";
import { env } from "./config/env.js";
import { onGuildCreate } from "./events/guildCreate.js";
import { onGuildMemberAdd } from "./events/guildMemberAdd.js";
import { onInteractionCreate } from "./events/interactionCreate.js";
import { onClientReady } from "./events/ready.js";
import { D1Class } from "./services/d1.js";
import { printMessage } from "./lib/logger.js";
import type { BotClient } from "./types/client.js";
import type { VRChatGroup } from "./types/models.js";

// =========================================================================================================
// Initialization
// =========================================================================================================

D1Class.init({ apiKey: env.D1_PRIVATE_KEY });

const client = new Client({
  intents: [GatewayIntentBits.GuildMembers, GatewayIntentBits.Guilds],
}) as BotClient;

client.commands = new Collection();
client.vrchatGroups = new Collection<string, VRChatGroup[]>();

for (const command of allCommands) {
  client.commands.set(command.data.name, command);
}

// =========================================================================================================
// Event Wiring
// =========================================================================================================

client.once(Events.ClientReady, (readyClient) => {
  void onClientReady(readyClient);
});

client.on(Events.InteractionCreate, (interaction) => {
  void onInteractionCreate(interaction);
});

client.on(Events.GuildCreate, (guild) => {
  void onGuildCreate(guild);
});

client.on(Events.GuildMemberAdd, (member) => {
  void onGuildMemberAdd(member);
});

// =========================================================================================================
// Login
// =========================================================================================================

void client.login(env.DISCORD_TOKEN);

// =========================================================================================================
// Graceful Shutdown
// =========================================================================================================

let shuttingDown = false;

/** Destroys the Discord connection and exits. Guarded so overlapping signals don't double-run. */
async function gracefulShutdown(signal: string, exitCode = 0): Promise<void> {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;

  printMessage(`Received ${signal}, shutting down gracefully...`);
  await client.destroy();
  printMessage("Discord client disconnected successfully.");
  process.exit(exitCode);
}

process.on("SIGINT", () => void gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => void gracefulShutdown("SIGTERM"));

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  // Bug fix: the original logged but never shut down on uncaught exceptions, leaving a half-dead
  // process. Exit non-zero so a supervisor can restart cleanly.
  void gracefulShutdown("uncaughtException", 1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

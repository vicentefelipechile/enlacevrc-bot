// =========================================================================================================
// Deploy Commands
// =========================================================================================================
// Registers the bot's slash commands with Discord. Commands are pushed globally and, additionally, to
// every guild the bot is registered in (guild commands update instantly, which is convenient while
// iterating). Run via `npm run deploy-commands`.

// =========================================================================================================
// Imports
// =========================================================================================================

import { REST, Routes } from "discord.js";
import type { RESTPostAPIApplicationCommandsJSONBody } from "discord.js";

import { allCommands } from "../src/commands/index.js";
import { env } from "../src/config/env.js";
import { D1Class } from "../src/services/d1.js";
import { printMessage } from "../src/lib/logger.js";
import type { UserRequestData } from "../src/types/models.js";

// =========================================================================================================
// Main
// =========================================================================================================

async function deployCommands(): Promise<void> {
  D1Class.init({ apiKey: env.D1_PRIVATE_KEY });

  const commandsToDeploy: RESTPostAPIApplicationCommandsJSONBody[] = allCommands.map((command) =>
    command.data.toJSON(),
  );

  const rest = new REST().setToken(env.DISCORD_TOKEN);

  printMessage(`Registering ${commandsToDeploy.length} command(s)...`);

  const globalData = (await rest.put(Routes.applicationCommands(env.DISCORD_CLIENT_ID), {
    body: commandsToDeploy,
  })) as unknown[];

  const userRequestData: UserRequestData = {
    discord_id: env.DISCORD_CLIENT_ID,
    discord_name: env.VRCHAT_APPLICATION_NAME,
  };

  const discordServers = await D1Class.listDiscordServers(userRequestData);

  for (const server of discordServers) {
    try {
      await rest.put(
        Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID, server.discord_server_id),
        { body: commandsToDeploy },
      );
      printMessage(`Registered commands in server: ${server.server_name}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      printMessage(`[ERROR] Could not register commands in ${server.server_name}: ${message}`);
    }
  }

  printMessage(`Globally registered ${globalData.length} command(s) successfully.`);
}

deployCommands()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });

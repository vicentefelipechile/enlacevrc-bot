// =========================================================================================================
// Deploy Commands
// =========================================================================================================
// Registers the bot's slash commands with Discord. By default commands are pushed only to every guild
// the bot is registered in (guild commands update instantly, which is convenient while iterating).
// Pass the `--global` flag to additionally register the commands globally. Run via
// `npm run deploy-commands` (guild-only) or `npm run deploy-commands -- --global`.

// =========================================================================================================
// Imports
// =========================================================================================================

import { DiscordAPIError, REST, RESTJSONErrorCodes, Routes } from "discord.js";
import type { RESTPostAPIApplicationCommandsJSONBody } from "discord.js";

import { allCommands } from "../src/commands/index.js";
import { env } from "../src/config/env.js";
import { D1Class } from "../src/services/d1.js";
import { printMessage } from "../src/lib/logger.js";
import type { UserRequestData } from "../src/types/models.js";

// =========================================================================================================
// Helpers
// =========================================================================================================

// Maps the Discord API error codes seen when registering guild commands to an actionable explanation,
// so a failed deploy says *why* it failed and *how* to fix it instead of a bare "Missing Access".
function describeDeployError(error: unknown): string {
  if (!(error instanceof DiscordAPIError)) {
    return error instanceof Error ? error.message : String(error);
  }

  switch (error.code) {
    case RESTJSONErrorCodes.MissingAccess:
      return (
        "Missing Access — the bot is in this server but was invited without the " +
        "'applications.commands' scope (or has since lost it). Re-invite/re-authorize it with a URL " +
        "that includes 'scope=bot applications.commands' (use the /invite link), then deploy again."
      );
    case RESTJSONErrorCodes.UnknownGuild:
      return (
        "Unknown Guild — the bot is no longer in this server, but it is still registered in D1. " +
        "Remove the stale server from the database (or re-invite the bot)."
      );
    case RESTJSONErrorCodes.MissingPermissions:
      return "Missing Permissions — the bot lacks the permissions required to register commands here.";
    default:
      return `${error.message} (code ${error.code})`;
  }
}

// =========================================================================================================
// Main
// =========================================================================================================

async function deployCommands(): Promise<void> {
  // Global registration is opt-in: it only runs when the `--global` flag is passed.
  const deployGlobal = process.argv.slice(2).includes("--global");

  D1Class.init({ apiKey: env.D1_PRIVATE_KEY });

  const commandsToDeploy: RESTPostAPIApplicationCommandsJSONBody[] = allCommands.map((command) =>
    command.data.toJSON(),
  );

  const rest = new REST().setToken(env.DISCORD_TOKEN);

  printMessage(`Registering ${commandsToDeploy.length} command(s)...`);

  if (deployGlobal) {
    const globalData = (await rest.put(Routes.applicationCommands(env.DISCORD_CLIENT_ID), {
      body: commandsToDeploy,
    })) as unknown[];
    printMessage(`Globally registered ${globalData.length} command(s) successfully.`);
  } else {
    printMessage("Skipping global registration (pass --global to enable).");
  }

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
      printMessage(`Registered commands in server: ${server.discord_server_name}`);
    } catch (error) {
      printMessage(
        `[ERROR] Could not register commands in ${server.discord_server_name} ` +
          `(${server.discord_server_id}): ${describeDeployError(error)}`,
      );
    }
  }

  printMessage("Done.");
}

deployCommands()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });

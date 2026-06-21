// =========================================================================================================
// Clear Global Commands
// =========================================================================================================
// Removes every globally registered slash command by overwriting the global command set with an empty
// array. Guild-scoped commands are left untouched. Run via `npm run clear-global-commands`.

// =========================================================================================================
// Imports
// =========================================================================================================

import { REST, Routes } from "discord.js";

import { env } from "../src/config/env.js";
import { printMessage } from "../src/lib/logger.js";

// =========================================================================================================
// Main
// =========================================================================================================

async function clearGlobalCommands(): Promise<void> {
  const rest = new REST().setToken(env.DISCORD_TOKEN);

  printMessage("Clearing all global commands...");

  await rest.put(Routes.applicationCommands(env.DISCORD_CLIENT_ID), { body: [] });

  printMessage("All global commands have been removed.");
}

clearGlobalCommands()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });

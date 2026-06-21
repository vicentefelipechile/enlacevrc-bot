// =========================================================================================================
// Login Script
// =========================================================================================================
// Signs in to VRChat interactively (prompting for the 2FA code if needed) and persists the session
// cookie. Run once before starting the bot so the cookie file exists. Reuses the bot's own sign-in
// logic so behaviour stays identical.

// =========================================================================================================
// Imports
// =========================================================================================================

import { signIn } from "../src/services/vrchat.js";
import { printMessage } from "../src/lib/logger.js";

// =========================================================================================================
// Main
// =========================================================================================================

async function main(): Promise<void> {
  const client = await signIn();
  if (!client) {
    printMessage("VRChat sign-in failed. Run this command again to retry.");
    process.exit(1);
  }

  printMessage("VRChat client initialized successfully.");
  process.exit(0);
}

void main();

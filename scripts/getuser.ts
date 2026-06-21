// =========================================================================================================
// Get User Script
// =========================================================================================================
// Looks up and prints a profile by Discord ID or VRChat ID. Usage:
//   npm run getuser <discord_id | vrchat_id>

// =========================================================================================================
// Imports
// =========================================================================================================

import { D1Class } from "../src/services/d1.js";
import { printMessage } from "../src/lib/logger.js";
import type { Profile } from "../src/types/models.js";
import { getArgs, initAdmin, isValidDiscordId, isValidVRChatId } from "./lib/admin.js";

// =========================================================================================================
// Constants
// =========================================================================================================

const DIVIDER = "═".repeat(55);

// =========================================================================================================
// Helpers
// =========================================================================================================

/** Pretty-prints the relevant fields of a profile. */
function displayProfile(profile: Profile): void {
  printMessage(DIVIDER);
  printMessage("Profile information:");
  printMessage(DIVIDER);
  printMessage(`  Discord ID:  ${profile.discord_id}`);
  printMessage(`  VRChat ID:   ${profile.vrchat_id}`);
  printMessage(`  VRChat name: ${profile.vrchat_name}`);
  printMessage(`  Verified:    ${profile.is_verified ? "Yes" : "No"}`);
  printMessage(`  Banned:      ${profile.is_banned ? "Yes" : "No"}`);
  if (profile.banned_reason) {
    printMessage(`  Ban reason:  ${profile.banned_reason}`);
  }
  printMessage(`  Added at:    ${profile.added_at}`);
  printMessage(`  Updated at:  ${profile.updated_at}`);
  printMessage(DIVIDER);
}

// =========================================================================================================
// Main
// =========================================================================================================

async function main(): Promise<void> {
  const userRequestData = initAdmin();
  const args = getArgs();

  if (args.length < 1) {
    printMessage("Error: 1 argument required.");
    printMessage("Usage: npm run getuser <discord_id | vrchat_id>");
    process.exit(1);
  }

  const userId = args[0] as string;

  let idType: string;
  if (isValidDiscordId(userId)) {
    idType = "Discord ID";
  } else if (isValidVRChatId(userId)) {
    idType = "VRChat ID";
  } else {
    printMessage(`Error: invalid ID: "${userId}".`);
    printMessage("Must be a Discord ID (digits only) or a VRChat ID (usr_...).");
    process.exit(1);
  }

  printMessage(`Looking up profile by ${idType}: ${userId}...`);

  const profile = await D1Class.getProfile(userRequestData, userId, false).catch(() => null);
  if (!profile) {
    printMessage(`Error: no profile found for ${idType}: "${userId}".`);
    process.exit(1);
  }

  displayProfile(profile);
  printMessage("Profile retrieved successfully.");
  process.exit(0);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  printMessage(`Error while retrieving user: ${message}`);
  process.exit(1);
});

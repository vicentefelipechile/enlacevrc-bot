// =========================================================================================================
// Delete User Script
// =========================================================================================================
// Deletes a profile by Discord ID or VRChat ID after showing it and asking for confirmation. Usage:
//   npm run deluser <discord_id | vrchat_id>

// =========================================================================================================
// Imports
// =========================================================================================================

import { D1Class } from "../src/services/d1.js";
import { printMessage } from "../src/lib/logger.js";
import { confirmAction, getArgs, initAdmin, isValidDiscordId, isValidVRChatId } from "./lib/admin.js";

// =========================================================================================================
// Constants
// =========================================================================================================

const DIVIDER = "═".repeat(55);

// =========================================================================================================
// Main
// =========================================================================================================

async function main(): Promise<void> {
  const userRequestData = initAdmin();
  const args = getArgs();

  if (args.length < 1) {
    printMessage("Error: 1 argument required.");
    printMessage("Usage: npm run deluser <discord_id | vrchat_id>");
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

  printMessage(DIVIDER);
  printMessage("Profile to delete:");
  printMessage(DIVIDER);
  printMessage(`  Discord ID:  ${profile.discord_id}`);
  printMessage(`  VRChat ID:   ${profile.vrchat_id}`);
  printMessage(`  VRChat name: ${profile.vrchat_name}`);
  printMessage(DIVIDER);

  const confirmed = await confirmAction("Are you sure you want to delete this profile? (y/n): ");
  if (!confirmed) {
    printMessage("Deletion cancelled.");
    process.exit(0);
  }

  printMessage("Deleting profile...");
  await D1Class.deleteProfile(userRequestData, userId);

  printMessage("User deleted successfully.");
  printMessage(`  ${idType}: ${userId}`);
  process.exit(0);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  printMessage(`Error while deleting user: ${message}`);
  process.exit(1);
});

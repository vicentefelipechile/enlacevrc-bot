// =========================================================================================================
// Add User Script
// =========================================================================================================
// Links a Discord account to a VRChat account by creating a profile in the database. Looks up the
// VRChat display name so the profile is created with the real name when available. Usage:
//   npm run adduser <discord_id> <vrchat_id>

// =========================================================================================================
// Imports
// =========================================================================================================

import { D1Class } from "../src/services/d1.js";
import { VRCHAT_CLIENT } from "../src/services/vrchat.js";
import { printMessage } from "../src/lib/logger.js";
import type { CreateProfileInput } from "../src/types/models.js";
import { getArgs, initAdmin, isValidDiscordId, isValidVRChatId } from "./lib/admin.js";

// =========================================================================================================
// Constants
// =========================================================================================================

const REQUIRED_ARGS = 2;
const UNKNOWN_NAME = "Unknown";

// =========================================================================================================
// Main
// =========================================================================================================

async function main(): Promise<void> {
  const userRequestData = initAdmin();
  const args = getArgs();

  if (args.length < REQUIRED_ARGS) {
    printMessage("Error: 2 arguments required.");
    printMessage("Usage: npm run adduser <discord_id> <vrchat_id>");
    printMessage("Example: npm run adduser 123456789012345678 usr_XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX");
    process.exit(1);
  }

  const [discordId, vrchatId] = args as [string, string];

  if (!isValidDiscordId(discordId)) {
    printMessage(`Error: invalid Discord ID: "${discordId}" (must be digits only).`);
    process.exit(1);
  }

  if (!isValidVRChatId(vrchatId)) {
    printMessage(`Error: invalid VRChat ID: "${vrchatId}".`);
    printMessage("Expected format: usr_XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX");
    process.exit(1);
  }

  // Bail out if a profile already exists for this VRChat ID.
  printMessage("Checking whether the profile already exists...");
  // Bug fix: the original passed a misspelled `vrhcatId` here, so this check never matched.
  const existingProfile = await D1Class.getProfile(userRequestData, vrchatId, false).catch(
    () => null,
  );
  if (existingProfile) {
    printMessage(`Error: a profile for VRChat ID "${vrchatId}" already exists.`);
    process.exit(1);
  }

  printMessage("Creating new profile...");

  const profileData: CreateProfileInput = {
    vrchat_id: vrchatId,
    discord_id: discordId,
    vrchat_name: UNKNOWN_NAME,
  };

  const vrchatResponse = await VRCHAT_CLIENT.getUser({ path: { userId: vrchatId } });
  const displayName = vrchatResponse.data?.displayName;
  if (displayName) {
    profileData.vrchat_name = displayName;
  }

  await D1Class.createProfile(userRequestData, profileData);

  printMessage("User added successfully:");
  printMessage(`  Discord ID: ${discordId}`);
  printMessage(`  VRChat ID:  ${vrchatId}`);
  printMessage(`  VRChat name: ${profileData.vrchat_name}`);
  process.exit(0);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  printMessage(`Error while adding user: ${message}`);
  process.exit(1);
});

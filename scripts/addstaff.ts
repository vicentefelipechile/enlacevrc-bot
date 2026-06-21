// =========================================================================================================
// Add Staff Script
// =========================================================================================================
// Registers a new authorized staff member. Usage:
//   npm run addstaff <discord_id> <discord_name>

// =========================================================================================================
// Imports
// =========================================================================================================

import { D1Class } from "../src/services/d1.js";
import { printMessage } from "../src/lib/logger.js";
import type { CreateStaffInput } from "../src/types/models.js";
import { getArgs, initAdmin, isValidDiscordId } from "./lib/admin.js";

// =========================================================================================================
// Constants
// =========================================================================================================

const REQUIRED_ARGS = 2;

// =========================================================================================================
// Main
// =========================================================================================================

async function main(): Promise<void> {
  const userRequestData = initAdmin();
  const args = getArgs();

  if (args.length < REQUIRED_ARGS) {
    printMessage("Error: 2 arguments required.");
    printMessage('Usage: npm run addstaff <discord_id> <discord_name>');
    printMessage('Example: npm run addstaff 123456789012345678 "User#1234"');
    process.exit(1);
  }

  const [discordId, discordName] = args as [string, string];

  if (!isValidDiscordId(discordId)) {
    printMessage(`Error: invalid Discord ID: "${discordId}" (must be digits only).`);
    process.exit(1);
  }

  printMessage("Checking whether the staff member already exists...");
  const existingStaff = await D1Class.getStaff(userRequestData, discordId, false).catch(() => null);
  if (existingStaff) {
    printMessage(`Error: staff with ID "${discordId}" already exists.`);
    printMessage(`  Current name: ${existingStaff.discord_name ?? "Unknown"}`);
    process.exit(1);
  }

  printMessage("Adding new staff member...");

  const staffData: CreateStaffInput = {
    discord_id: discordId,
    discord_name: discordName,
  };

  await D1Class.createStaff(userRequestData, staffData);

  printMessage("Staff added successfully:");
  printMessage(`  Discord ID: ${discordId}`);
  printMessage(`  Name:       ${discordName}`);
  process.exit(0);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  printMessage(`Error while adding staff: ${message}`);
  process.exit(1);
});

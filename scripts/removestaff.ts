// =========================================================================================================
// Remove Staff Script
// =========================================================================================================
// Removes an authorized staff member by Discord ID. Usage:
//   npm run removestaff <discord_id>

// =========================================================================================================
// Imports
// =========================================================================================================

import { D1Class } from "../src/services/d1.js";
import { printMessage } from "../src/lib/logger.js";
import { getArgs, initAdmin, isValidDiscordId } from "./lib/admin.js";

// =========================================================================================================
// Main
// =========================================================================================================

async function main(): Promise<void> {
  const userRequestData = initAdmin();
  const args = getArgs();

  if (args.length < 1) {
    printMessage("Error: 1 argument required.");
    printMessage("Usage: npm run removestaff <discord_id>");
    printMessage("Example: npm run removestaff 123456789012345678");
    process.exit(1);
  }

  const discordId = args[0] as string;

  if (!isValidDiscordId(discordId)) {
    printMessage(`Error: invalid Discord ID: "${discordId}" (must be digits only).`);
    process.exit(1);
  }

  printMessage("Checking whether the staff member exists...");
  const existingStaff = await D1Class.getStaff(userRequestData, discordId, false).catch(() => null);
  if (!existingStaff) {
    printMessage(`Error: no staff member found with ID "${discordId}".`);
    process.exit(1);
  }

  printMessage(`Removing staff: ${existingStaff.discord_name ?? "Unknown"} (${discordId})`);
  await D1Class.deleteStaff(userRequestData, discordId);

  printMessage("Staff removed successfully.");
  process.exit(0);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  printMessage(`Error while removing staff: ${message}`);
  process.exit(1);
});

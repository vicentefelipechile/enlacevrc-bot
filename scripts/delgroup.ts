// =========================================================================================================
// Delete Group Script
// =========================================================================================================
// Unlinks a VRChat group from the Discord server it is registered to, by VRChat group id, after showing
// the group and its server and asking for confirmation. Usage:
//   npm run delgroup <grp_id>

// =========================================================================================================
// Imports
// =========================================================================================================

import { D1Class } from "../src/services/d1.js";
import { printMessage } from "../src/lib/logger.js";
import { confirmAction, getArgs, initAdmin, isValidVRChatGroupId } from "./lib/admin.js";

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
    printMessage("Usage: npm run delgroup <grp_id>");
    printMessage("Example: npm run delgroup grp_12345678-1234-1234-1234-123456789012");
    process.exit(1);
  }

  const groupId = args[0] as string;

  if (!isValidVRChatGroupId(groupId)) {
    printMessage(`Error: invalid VRChat group ID: "${groupId}".`);
    printMessage("Expected format: grp_XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX");
    process.exit(1);
  }

  printMessage(`Looking up group: ${groupId}...`);

  const group = await D1Class.getVRChatGroup(userRequestData, groupId, false).catch(() => null);
  if (!group) {
    printMessage(`Error: no linked group found for "${groupId}".`);
    process.exit(1);
  }

  // The linked server is informational; failing to resolve it must not block the deletion.
  const server = await D1Class.getVRChatGroupServer(userRequestData, groupId, false).catch(() => null);

  printMessage(DIVIDER);
  printMessage("Group to unlink:");
  printMessage(DIVIDER);
  printMessage(`  Group ID:    ${group.vrchat_group_id}`);
  printMessage(`  Group name:  ${group.group_name}`);
  printMessage(`  Discord server: ${server ? `${server.discord_server_name} (${server.discord_server_id})` : group.discord_server_id}`);
  printMessage(DIVIDER);

  const confirmed = await confirmAction("Are you sure you want to unlink this group? (y/n): ");
  if (!confirmed) {
    printMessage("Deletion cancelled.");
    process.exit(0);
  }

  printMessage("Unlinking group...");
  await D1Class.deleteVRChatGroup(userRequestData, groupId);

  printMessage("Group unlinked successfully.");
  printMessage(`  Group ID: ${groupId}`);
  process.exit(0);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  printMessage(`Error while unlinking group: ${message}`);
  process.exit(1);
});

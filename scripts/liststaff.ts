// =========================================================================================================
// List Staff Script
// =========================================================================================================
// Lists every authorized staff member. Usage:
//   npm run liststaff

// =========================================================================================================
// Imports
// =========================================================================================================

import { D1Class } from "../src/services/d1.js";
import { printMessage } from "../src/lib/logger.js";
import type { Staff } from "../src/types/models.js";
import { initAdmin } from "./lib/admin.js";

// =========================================================================================================
// Constants
// =========================================================================================================

const DIVIDER = "═".repeat(55);

// =========================================================================================================
// Helpers
// =========================================================================================================

/** Prints the staff list, or a notice if it's empty. */
function displayStaffList(staffList: Staff[]): void {
  if (staffList.length === 0) {
    printMessage("No staff members available.");
    return;
  }

  printMessage(DIVIDER);
  printMessage(`Staff members (total: ${staffList.length})`);
  printMessage(DIVIDER);

  staffList.forEach((staff, index) => {
    printMessage(`${index + 1}. Discord ID: ${staff.discord_id}`);
    printMessage(`   Name:       ${staff.discord_name ?? "Unknown"}`);
    printMessage(`   Added at:   ${staff.added_at}`);
  });

  printMessage(DIVIDER);
}

// =========================================================================================================
// Main
// =========================================================================================================

async function main(): Promise<void> {
  const userRequestData = initAdmin();

  printMessage("Fetching staff list...");
  const staffList = await D1Class.listStaff(userRequestData, false);

  displayStaffList(staffList);
  printMessage("Staff list retrieved successfully.");
  process.exit(0);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  printMessage(`Error while fetching staff: ${message}`);
  process.exit(1);
});

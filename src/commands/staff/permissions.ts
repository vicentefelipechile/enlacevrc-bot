// =========================================================================================================
// Staff Permissions
// =========================================================================================================
// Shared staff gate for every /staff subcommand. A user is allowed when they are registered as staff in
// the database, or when they are the bootstrap identity configured in DISCORD_STAFF_ID — the latter is
// the root administrator who can register the first real staff member when the table is still empty.

// =========================================================================================================
// Imports
// =========================================================================================================

import { env } from "../../config/env.js";
import { D1Class } from "../../services/d1.js";
import type { UserRequestData } from "../../types/models.js";

// =========================================================================================================
// Main
// =========================================================================================================

/**
 * True when the invoking user may run /staff. Registered staff (in D1) always pass; the configured
 * bootstrap identity passes even when absent from the table, so there is always a way to seed the
 * first staff member from Discord.
 */
export async function isStaff(userId: string, username: string): Promise<boolean> {
  if (userId === env.DISCORD_STAFF_ID) {
    return true;
  }

  try {
    const staff = await D1Class.getStaff({ discord_id: userId, discord_name: username }, userId);
    return staff !== null;
  } catch {
    return false;
  }
}

/** Builds the UserRequestData identifying the invoking staff member for D1 calls. */
export function staffRequestData(userId: string, username: string): UserRequestData {
  return { discord_id: userId, discord_name: username };
}

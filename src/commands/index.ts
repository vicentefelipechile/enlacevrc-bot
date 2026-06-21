// =========================================================================================================
// Command Registry
// =========================================================================================================
// The single source of truth for every command the bot ships. Both the runtime (index.ts) and the
// deploy script import this flat list. We register commands explicitly rather than scanning the
// directory at runtime: it is type-safe, keeps import side effects ordered, and works identically
// under tsx and compiled output without juggling file extensions.

// =========================================================================================================
// Imports
// =========================================================================================================

import { command as adduser } from "./adduser.js";
import { command as ban } from "./ban.js";
import { command as group } from "./group.js";
import { command as howitworks } from "./howitworks.js";
import { command as invite } from "./invite.js";
import { command as linkgroup } from "./linkgroup.js";
import { command as profile } from "./profile.js";
import { command as search } from "./search.js";
import { command as settings } from "./settings.js";
import { command as sync } from "./sync.js";
import type { Command } from "./types.js";
import { command as unban } from "./unban.js";
import { commands as verificationCommands } from "./verification.js";
import { command as verifyuser } from "./verifyuser.js";
import { command as viewprofile } from "./viewprofile.js";
import { command as worldinfo } from "./worldinfo.js";

// =========================================================================================================
// Main
// =========================================================================================================

/** Every command the bot exposes, flattened (verification contributes two commands). */
export const allCommands: Command[] = [
  adduser,
  ban,
  group,
  howitworks,
  invite,
  linkgroup,
  profile,
  search,
  settings,
  sync,
  unban,
  verifyuser,
  viewprofile,
  worldinfo,
  ...verificationCommands,
];

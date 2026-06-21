// =========================================================================================================
// Admin Script Helpers
// =========================================================================================================
// Shared building blocks for the CLI admin scripts: ID validation, the request identity those scripts
// act under (the configured staff identity), argument parsing and a yes/no confirmation prompt. Keeping
// these in one place means every script validates and identifies itself the same way.

// =========================================================================================================
// Imports
// =========================================================================================================

import { createInterface } from "node:readline";

import { env } from "../../src/config/env.js";
import { D1Class } from "../../src/services/d1.js";
import type { UserRequestData } from "../../src/types/models.js";

// =========================================================================================================
// Constants
// =========================================================================================================

const DISCORD_ID_PATTERN = /^\d+$/;
const VRCHAT_ID_PATTERN =
  /^usr_[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;

const AFFIRMATIVE_ANSWERS = new Set(["s", "y", "si", "sí", "yes"]);

const FALLBACK_DISCORD_ID = "0";
const FALLBACK_DISCORD_NAME = "EnlaceVRC-Bot";

// =========================================================================================================
// Helpers
// =========================================================================================================

/** True if the input is a plain Discord snowflake (digits only). */
export function isValidDiscordId(input: string): boolean {
  return DISCORD_ID_PATTERN.test(input);
}

/** True if the input matches the VRChat user-id format (usr_<uuid>). */
export function isValidVRChatId(input: string): boolean {
  return VRCHAT_ID_PATTERN.test(input);
}

/**
 * Initializes the D1 client (idempotently) and returns the staff identity the scripts act under.
 * Falls back to neutral values if the staff identity isn't configured.
 */
export function initAdmin(): UserRequestData {
  D1Class.init({ apiKey: env.D1_PRIVATE_KEY });

  return {
    discord_id: env.DISCORD_STAFF_ID || FALLBACK_DISCORD_ID,
    discord_name: env.VRCHAT_APPLICATION_NAME || FALLBACK_DISCORD_NAME,
  };
}

/** Returns the positional CLI arguments (everything after `node script`). */
export function getArgs(): string[] {
  return process.argv.slice(2);
}

/** Prompts on stdin and resolves true if the user answered affirmatively. */
export function confirmAction(message: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  return new Promise((resolve) => {
    rl.question(message, (answer) => {
      rl.close();
      resolve(AFFIRMATIVE_ANSWERS.has(answer.trim().toLowerCase()));
    });
  });
}

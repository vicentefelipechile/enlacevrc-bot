// =========================================================================================================
// Environment Configuration
// =========================================================================================================
// Loads, validates and types every environment variable the bot relies on. Validation is fail-fast:
// a missing required variable aborts startup immediately instead of surfacing as a cryptic runtime
// error deep inside a Discord or VRChat call.

import { config as loadDotenv } from "dotenv";

// =========================================================================================================
// Constants
// =========================================================================================================

// Variables that must be present for the bot to function at all.
const REQUIRED_KEYS = [
  "DISCORD_TOKEN",
  "DISCORD_CLIENT_ID",
  "DISCORD_STAFF_ID",
  "D1_PRIVATE_KEY",
  "D1_URL",
  "VRCHAT_USERNAME",
  "VRCHAT_PASSWORD",
  "VRCHAT_EMAIL_CONTACT",
  "VRCHAT_APPLICATION_NAME",
] as const;

// =========================================================================================================
// Types
// =========================================================================================================

type RequiredKey = (typeof REQUIRED_KEYS)[number];

export interface Env {
  // Discord bot info.
  DISCORD_TOKEN: string;
  DISCORD_CLIENT_SECRET: string | undefined;
  DISCORD_CLIENT_ID: string;
  DISCORD_STAFF_ID: string;

  // Cloudflare D1.
  D1_PRIVATE_KEY: string;
  D1_URL: string;

  // VRChat info.
  VRCHAT_USERNAME: string;
  VRCHAT_PASSWORD: string;
  VRCHAT_EMAIL_CONTACT: string;
  VRCHAT_APPLICATION_NAME: string;
}

// =========================================================================================================
// Helpers
// =========================================================================================================

function loadEnv(): Env {
  loadDotenv({ quiet: true });

  const missing = REQUIRED_KEYS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  // Safe to assert non-null below: the loop above already guaranteed every required key is set.
  const required = (key: RequiredKey): string => process.env[key]!;

  return {
    DISCORD_TOKEN: required("DISCORD_TOKEN"),
    DISCORD_CLIENT_SECRET: process.env["DISCORD_CLIENT_SECRET"],
    DISCORD_CLIENT_ID: required("DISCORD_CLIENT_ID"),
    DISCORD_STAFF_ID: required("DISCORD_STAFF_ID"),
    D1_PRIVATE_KEY: required("D1_PRIVATE_KEY"),
    D1_URL: required("D1_URL"),
    VRCHAT_USERNAME: required("VRCHAT_USERNAME"),
    VRCHAT_PASSWORD: required("VRCHAT_PASSWORD"),
    VRCHAT_EMAIL_CONTACT: required("VRCHAT_EMAIL_CONTACT"),
    VRCHAT_APPLICATION_NAME: required("VRCHAT_APPLICATION_NAME"),
  };
}

// =========================================================================================================
// Main
// =========================================================================================================

export const env: Env = loadEnv();

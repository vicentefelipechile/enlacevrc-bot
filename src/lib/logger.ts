// =========================================================================================================
// Logger
// =========================================================================================================
// Prints timestamped, prefixed messages to the console. Kept intentionally tiny: the bot's logging
// needs are limited to a consistent prefix and a local-time stamp.

// =========================================================================================================
// Constants
// =========================================================================================================

const LOG_PREFIX = "EnlaceVRC";

const TIME_FORMAT: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
};

// =========================================================================================================
// Main
// =========================================================================================================

/**
 * Prints messages to the console with a timestamp and a consistent prefix. Multiple arguments are
 * joined with " | " so a single call can describe context and detail on one line.
 */
export function printMessage(...messages: unknown[]): void {
  const currentTime = new Date().toLocaleTimeString([], TIME_FORMAT);
  const allMessages = messages.map(String).join(" | ");

  console.log(`[${LOG_PREFIX}] [${currentTime}] => ${allMessages}`);
}

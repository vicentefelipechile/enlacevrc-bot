// =========================================================================================================
// Localization Helper
// =========================================================================================================
// createLocalizer centralizes the one piece of localization logic that would otherwise be copy-pasted
// into every command: pick the phrase table for the viewer's locale, falling back to English. It is a
// pure data helper (it does not intercept interactions), so it fits the plain discord.js approach.
//
// Usage:
//   const t = createLocalizer({
//     [Locale.EnglishUS]:    { title: "Hi" },
//     [Locale.SpanishLATAM]: { title: "Hola" },
//   });
//   t(interaction.locale).title;   // typed, falls back to English for any missing locale

// =========================================================================================================
// Imports
// =========================================================================================================

import { Locale } from "discord.js";

// =========================================================================================================
// Types
// =========================================================================================================

/**
 * Phrase tables keyed by locale. EnglishUS is required as the fallback; every other locale is optional
 * and falls back to English when absent. T is inferred from the English table, so the command never has
 * to declare an interface or Record.
 */
export type Phrases<T> = { [Locale.EnglishUS]: T } & Partial<Record<Locale, T>>;

/** Selects the phrase table for a given locale. */
export type Localizer<T> = (locale: Locale) => T;

// =========================================================================================================
// Main
// =========================================================================================================

/**
 * Builds a localizer from a phrase map. The returned function takes a Discord locale and returns the
 * matching table, or the English table when that locale has no entry.
 */
export function createLocalizer<T>(phrases: Phrases<T>): Localizer<T> {
  return (locale: Locale): T => phrases[locale] ?? phrases[Locale.EnglishUS];
}

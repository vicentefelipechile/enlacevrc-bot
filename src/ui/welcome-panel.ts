// =========================================================================================================
// Welcome Panel
// =========================================================================================================
// The static onboarding panel a server posts in a text channel: a short guided message plus a "Verify"
// button that funnels brand-new members into the verification flow. The panel lives forever (it is not a
// reply to an interaction), so it is rendered in the guild's own language, and a single publisher with a
// permission pre-flight is shared by `/settings`, `/welcomepanel`, and the guildMemberAdd ping handler.

// =========================================================================================================
// Imports
// =========================================================================================================

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  Colors,
  ContainerBuilder,
  Locale,
  MessageFlags,
  PermissionsBitField,
  SeparatorBuilder,
  SeparatorSpacingSize,
  TextDisplayBuilder,
} from "discord.js";
import type { Guild, GuildTextBasedChannel } from "discord.js";

import { createLocalizer } from "../lib/i18n.js";

// =========================================================================================================
// Constants
// =========================================================================================================

// Button custom id: routed to the `welcomepanel` command's handleButton (prefix before the first `_`).
export const WELCOME_PANEL_BUTTON_ID = "welcomepanel_verify";

// The panel is persistent and language-neutral toward the server, so it cannot use an interaction locale.
// It is rendered from the guild's own `preferredLocale`: any Spanish variant uses neutral LATAM Spanish
// (the exaggerated SpanishES flavor is intentionally excluded from this owner-facing panel), else English.
const localize = createLocalizer({
  [Locale.EnglishUS]: {
    "panel.title": "👋 Welcome — Verify your account",
    "panel.description":
      "New here? To unlock the server you need to **link your VRChat account**. It only takes a minute:\n\n" +
      "1. Press the **Verify** button below.\n" +
      "2. Follow the short instructions the bot sends you.\n\n" +
      "Once you're verified you'll get access to the rest of the server.",
    "panel.button": "Verify",
    "panel.footer": "Only you can see what the button sends — nobody else in this channel will.",
  },
  [Locale.SpanishLATAM]: {
    "panel.title": "👋 Bienvenido — Verifica tu cuenta",
    "panel.description":
      "¿Recién llegas? Para desbloquear el servidor necesitas **vincular tu cuenta de VRChat**. Solo toma un minuto:\n\n" +
      "1. Presiona el botón **Verificar** de abajo.\n" +
      "2. Sigue las breves instrucciones que te enviará el bot.\n\n" +
      "Una vez verificado tendrás acceso al resto del servidor.",
    "panel.button": "Verificar",
    "panel.footer": "Solo tú puedes ver lo que envía el botón — nadie más en este canal lo verá.",
  },
});

// =========================================================================================================
// Types
// =========================================================================================================

type Phrases = ReturnType<typeof localize>;

/** Why a panel publish attempt could not proceed, for actionable error reporting. */
export type PanelChannelIssue = "not_found" | "not_text" | "cannot_view" | "cannot_send";

/** Result of resolving a channel for the panel: either a usable channel or the reason it isn't. */
export type PanelChannelCheck =
  | { ok: true; channel: GuildTextBasedChannel }
  | { ok: false; issue: PanelChannelIssue };

// =========================================================================================================
// Helpers
// =========================================================================================================

// The single source of truth for the languages the panel supports. Each entry pairs a native discord.js
// `Locale` (stored verbatim in `welcome_panel_language`, e.g. "es-419") with the label shown in the
// `/welcomepanel send language:` picker. To add a language, add one entry here AND a matching phrase table
// to `localize` above — nothing else changes: the command choices, the stored value and the resolver all
// derive from this list. The FIRST entry is the default when the guild's locale isn't a supported one.
export const PANEL_LANGUAGES = [
  { locale: Locale.SpanishLATAM, label: "Español" },
  { locale: Locale.EnglishUS, label: "English" },
] as const;

/**
 * Maps a guild's preferred locale to a supported panel locale: an exact match wins, then any Spanish
 * variant maps to the first Spanish entry, else the first supported language (the default).
 */
function guildPanelLocale(guild: Guild): Locale {
  const exact = PANEL_LANGUAGES.find((lang) => lang.locale === guild.preferredLocale);
  if (exact) {
    return exact.locale;
  }

  if (guild.preferredLocale === Locale.SpanishES || guild.preferredLocale === Locale.SpanishLATAM) {
    const spanish = PANEL_LANGUAGES.find((lang) => lang.locale === Locale.SpanishLATAM);
    if (spanish) {
      return spanish.locale;
    }
  }

  return PANEL_LANGUAGES[0].locale;
}

/**
 * Resolves the panel's render locale: the explicitly stored `welcome_panel_language` (a native `Locale`
 * value chosen when the panel was published) wins if it is one the panel supports; otherwise it falls back
 * to the guild's preferred locale. Kept here so `/welcomepanel` (send/refresh) and the member-join
 * self-heal all render the panel identically.
 */
export function resolvePanelLocale(stored: string | undefined, guild: Guild): Locale {
  const match = PANEL_LANGUAGES.find((lang) => lang.locale === stored);
  return match?.locale ?? guildPanelLocale(guild);
}

/** Builds the persistent panel container in the given locale (defaults to the guild's preferred locale). */
export function buildWelcomePanel(guild: Guild, locale: Locale = guildPanelLocale(guild)): ContainerBuilder {
  const phrases: Phrases = localize(locale);

  return new ContainerBuilder()
    .setAccentColor(Colors.Blurple)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `## ${phrases["panel.title"]}\n\n${phrases["panel.description"]}`,
      ),
    )
    .addActionRowComponents(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(WELCOME_PANEL_BUTTON_ID)
          .setLabel(phrases["panel.button"])
          .setStyle(ButtonStyle.Success)
          .setEmoji("✅"),
      ),
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
    )
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${phrases["panel.footer"]}`));
}

/**
 * Resolves a channel id to a text channel the bot can actually post the panel in, checking, in order:
 * the channel exists, it is a guild text channel, the bot can view it, and the bot can send messages.
 * Callers turn the returned issue into a localized, actionable message instead of letting Discord throw
 * `50013 Missing Permissions` at send time.
 */
export async function resolvePanelChannel(
  guild: Guild,
  channelId: string,
): Promise<PanelChannelCheck> {
  const channel = guild.channels.cache.get(channelId) ?? (await guild.channels.fetch(channelId).catch(() => null));
  if (!channel) {
    return { ok: false, issue: "not_found" };
  }
  if (channel.type !== ChannelType.GuildText && channel.type !== ChannelType.GuildAnnouncement) {
    return { ok: false, issue: "not_text" };
  }

  const botMember = await guild.members.fetchMe();
  const perms = channel.permissionsFor(botMember);
  if (!perms?.has(PermissionsBitField.Flags.ViewChannel)) {
    return { ok: false, issue: "cannot_view" };
  }
  if (!perms.has(PermissionsBitField.Flags.SendMessages)) {
    return { ok: false, issue: "cannot_send" };
  }

  return { ok: true, channel: channel as GuildTextBasedChannel };
}

/**
 * Publishes the panel into a pre-resolved channel and returns the new message id, or null on failure.
 * Failure is swallowed (and surfaced as null) so background callers like the member-join handler can
 * fall back to logging rather than crashing the gateway connection.
 */
export async function publishWelcomePanel(
  guild: Guild,
  channel: GuildTextBasedChannel,
  locale?: Locale,
): Promise<string | null> {
  const message = await channel
    .send({
      flags: MessageFlags.IsComponentsV2,
      components: [buildWelcomePanel(guild, locale)],
    })
    .catch(() => null);

  return message?.id ?? null;
}

// =========================================================================================================
// Welcome Panel Command
// =========================================================================================================
// Operates the static onboarding panel (the configuration — which channel, whether to ping — lives in
// `/settings`). Three subcommands: `send` publishes/re-publishes the panel in the configured channel and
// records its message id; `preview` shows the panel privately to the manager without posting it; `refresh`
// re-edits the existing published panel (re-publishing it if it was deleted). The panel's Verify button is
// routed here via handleButton and opens the verification instructions ephemerally. Requires Manage Guild.

// =========================================================================================================
// Imports
// =========================================================================================================

import {
  Colors,
  Locale,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import type { ButtonInteraction, ChatInputCommandInteraction, Guild } from "discord.js";

import type { Command } from "./types.js";
import { DISCORD_SERVER_SETTINGS } from "../constants/discord-settings.js";
import { createLocalizer } from "../lib/i18n.js";
import { printMessage } from "../lib/logger.js";
import { D1Class } from "../services/d1.js";
import { buildOpenModalButton } from "./verification.js";
import { textContainer } from "../ui/container.js";
import { buildVerifyVideo } from "../ui/verify-video.js";
import {
  buildWelcomePanel,
  PANEL_LANGUAGES,
  publishWelcomePanel,
  resolvePanelChannel,
  resolvePanelLocale,
  type PanelChannelIssue,
} from "../ui/welcome-panel.js";

// =========================================================================================================
// Constants
// =========================================================================================================

const PREFIX = "welcomepanel";

const SUBCOMMAND = {
  SEND: "send",
  PREVIEW: "preview",
  REFRESH: "refresh",
} as const;

// The `language` option on `send`, and its two allowed values (stored in `welcome_panel_language`).
const LANGUAGE_OPTION = "language";

// Component id after the `welcomepanel_` prefix (matches WELCOME_PANEL_BUTTON_ID in ui/welcome-panel).
const BUTTON = {
  VERIFY: "verify",
} as const;

const localize = createLocalizer({
  [Locale.EnglishUS]: {
    "error.no_guild": "This command can only be used inside a server.",
    "error.general": "An error occurred while operating the welcome panel. Please try again later.",
    "error.not_configured":
      "No welcome panel channel is configured. Set one first with `/settings set channel`.",
    "error.not_found": "The configured channel no longer exists. Please set it again with `/settings`.",
    "error.not_text": "The configured channel is not a text channel. Please pick a text channel.",
    "error.cannot_view": "I can't see the configured channel. Grant me the **View Channel** permission there.",
    "error.cannot_send":
      "I can't send messages in the configured channel. Grant me the **Send Messages** permission there.",
    "success.send": "The welcome panel has been published in <#{channel}>.",
    "success.refresh": "The welcome panel has been refreshed.",
    "success.refresh_republished":
      "The previous panel was gone, so I published a fresh one in <#{channel}>.",
    "verify.description":
      "# Verification\n\nPress the button below to type your VRChat username or profile URL — no need to write anything in the channel.",
    "verify.gotovrchat": "Go to VRChat",
    "modal.open": "Enter username or URL",
  },
  [Locale.SpanishLATAM]: {
    "error.no_guild": "Este comando solo puede usarse dentro de un servidor.",
    "error.general":
      "Ocurrió un error al operar el panel de bienvenida. Por favor, inténtalo de nuevo más tarde.",
    "error.not_configured":
      "No hay un canal de panel de bienvenida configurado. Configúralo primero con `/settings set channel`.",
    "error.not_found":
      "El canal configurado ya no existe. Por favor, vuelve a configurarlo con `/settings`.",
    "error.not_text": "El canal configurado no es un canal de texto. Por favor, elige un canal de texto.",
    "error.cannot_view":
      "No puedo ver el canal configurado. Otórgame el permiso **Ver Canal** en ese canal.",
    "error.cannot_send":
      "No puedo enviar mensajes en el canal configurado. Otórgame el permiso **Enviar Mensajes** en ese canal.",
    "success.send": "El panel de bienvenida ha sido publicado en <#{channel}>.",
    "success.refresh": "El panel de bienvenida ha sido actualizado.",
    "success.refresh_republished":
      "El panel anterior ya no estaba, así que publiqué uno nuevo en <#{channel}>.",
    "verify.description":
      "# Verificación\n\nPresiona el botón de abajo para escribir tu usuario o URL de VRChat — no necesitas escribir nada en el canal.",
    "verify.gotovrchat": "Ir a VRChat",
    "modal.open": "Introduce tu usuario o URL",
  },
  [Locale.SpanishES]: {
    "error.no_guild": "¡Ojo, chaval! Este comando solo va dentro de un servidor.",
    "error.general":
      "¡Madre mía! Algo ha petado con el panel de bienvenida. Prueba otra vez en un rato, colega.",
    "error.not_configured":
      "Que no hay canal puesto para el panel, tronco. Ponlo primero con `/settings set channel`.",
    "error.not_found": "El canal que pusiste ya no existe, macho. Vuelve a configurarlo con `/settings`.",
    "error.not_text": "Ese canal no es de texto, alma de cántaro. Elige uno de texto, anda.",
    "error.cannot_view": "Que no veo el canal ese. Dame el permiso de **Ver Canal** ahí, porfa.",
    "error.cannot_send":
      "Que no puedo escribir en ese canal, leñe. Dame el permiso de **Enviar Mensajes** ahí.",
    "success.send": "¡Hecho! El panel de bienvenida ya está en <#{channel}>, como Dios manda.",
    "success.refresh": "¡Listo! El panel de bienvenida está actualizado, que da gusto.",
    "success.refresh_republished":
      "El panel de antes ya no estaba, así que te he plantado uno nuevo en <#{channel}>.",
    "verify.description":
      "# Verificación\n\nDale al botón de abajo para soltar tu usuario o la URL de VRChat — sin tener que escribir nada en el canal, ¡pan comido!",
    "verify.gotovrchat": "Ir a VRChat",
    "modal.open": "Pon tu usuario o la URL",
  },
});

// =========================================================================================================
// Types
// =========================================================================================================

type Phrases = ReturnType<typeof localize>;

// =========================================================================================================
// Helpers
// =========================================================================================================

/** Maps a channel pre-flight issue to its localized, actionable error phrase. */
function issueMessage(issue: PanelChannelIssue, phrases: Phrases): string {
  switch (issue) {
    case "not_found":
      return phrases["error.not_found"];
    case "not_text":
      return phrases["error.not_text"];
    case "cannot_view":
      return phrases["error.cannot_view"];
    case "cannot_send":
      return phrases["error.cannot_send"];
  }
}

/** Reads the configured panel channel id, or "" when unset. */
async function getPanelChannelId(guild: Guild): Promise<string> {
  const settings = await D1Class.getAllDiscordSettings(
    { discord_id: guild.client.user.id, discord_name: guild.client.user.username },
    guild.id,
  );
  return settings[DISCORD_SERVER_SETTINGS.WELCOME_PANEL_CHANNEL] ?? "";
}

/** Reads the stored panel language ("es"/"en"), or "" when the language was never chosen. */
async function getPanelLanguage(guild: Guild): Promise<string> {
  const settings = await D1Class.getAllDiscordSettings(
    { discord_id: guild.client.user.id, discord_name: guild.client.user.username },
    guild.id,
  );
  return settings[DISCORD_SERVER_SETTINGS.WELCOME_PANEL_LANGUAGE] ?? "";
}

// =========================================================================================================
// Subcommands
// =========================================================================================================

/** Publishes a fresh panel in the configured channel and stores the new message id. */
async function runSend(
  interaction: ChatInputCommandInteraction,
  guild: Guild,
  phrases: Phrases,
): Promise<void> {
  const reply = (content: string, color: number = Colors.Green): Promise<unknown> =>
    interaction.editReply({ flags: MessageFlags.IsComponentsV2, components: [textContainer(content, color)] });

  const channelId = await getPanelChannelId(guild);
  if (!channelId) {
    await reply(phrases["error.not_configured"], Colors.Red);
    return;
  }

  const check = await resolvePanelChannel(guild, channelId);
  if (!check.ok) {
    await reply(issueMessage(check.issue, phrases), Colors.Red);
    return;
  }

  const userRequestData = { discord_id: interaction.user.id, discord_name: interaction.user.username };

  // The chosen language wins; if omitted, keep any previously stored language, else fall back to the
  // guild locale. Persisting it means refresh and the member-join self-heal render in the same language.
  // The option's value is a native discord.js `Locale` string (e.g. "es-419"), stored verbatim.
  const chosen = interaction.options.getString(LANGUAGE_OPTION);
  const stored = chosen ?? (await getPanelLanguage(guild));
  const locale = resolvePanelLocale(stored, guild);

  const messageId = await publishWelcomePanel(guild, check.channel, locale);
  if (!messageId) {
    await reply(phrases["error.general"], Colors.Red);
    return;
  }

  await D1Class.updateDiscordSetting(
    userRequestData,
    guild.id,
    DISCORD_SERVER_SETTINGS.WELCOME_PANEL_MESSAGE,
    messageId,
  );
  if (chosen) {
    await D1Class.updateDiscordSetting(
      userRequestData,
      guild.id,
      DISCORD_SERVER_SETTINGS.WELCOME_PANEL_LANGUAGE,
      chosen,
    );
  }
  await reply(phrases["success.send"].replace("{channel}", check.channel.id));
}

/** Shows the panel privately to the manager, in the stored language, without posting it publicly. */
async function runPreview(interaction: ChatInputCommandInteraction, guild: Guild): Promise<void> {
  const locale = resolvePanelLocale(await getPanelLanguage(guild), guild);
  await interaction.editReply({
    flags: MessageFlags.IsComponentsV2,
    components: [buildWelcomePanel(guild, locale)],
  });
}

/** Re-edits the existing published panel; re-publishes (and re-records the id) if it was deleted. */
async function runRefresh(
  interaction: ChatInputCommandInteraction,
  guild: Guild,
  phrases: Phrases,
): Promise<void> {
  const reply = (content: string, color: number = Colors.Green): Promise<unknown> =>
    interaction.editReply({ flags: MessageFlags.IsComponentsV2, components: [textContainer(content, color)] });

  const channelId = await getPanelChannelId(guild);
  if (!channelId) {
    await reply(phrases["error.not_configured"], Colors.Red);
    return;
  }

  const check = await resolvePanelChannel(guild, channelId);
  if (!check.ok) {
    await reply(issueMessage(check.issue, phrases), Colors.Red);
    return;
  }

  const userRequestData = { discord_id: interaction.user.id, discord_name: interaction.user.username };
  const settings = await D1Class.getAllDiscordSettings(userRequestData, guild.id);
  const messageId = settings[DISCORD_SERVER_SETTINGS.WELCOME_PANEL_MESSAGE] ?? "";
  const locale = resolvePanelLocale(settings[DISCORD_SERVER_SETTINGS.WELCOME_PANEL_LANGUAGE], guild);

  // Try to edit the recorded message in place; if it's gone, fall through to publishing a new one.
  if (messageId) {
    const existing = await check.channel.messages.fetch(messageId).catch(() => null);
    if (existing) {
      await existing.edit({
        flags: MessageFlags.IsComponentsV2,
        components: [buildWelcomePanel(guild, locale)],
      });
      await reply(phrases["success.refresh"]);
      return;
    }
  }

  const newId = await publishWelcomePanel(guild, check.channel, locale);
  if (!newId) {
    await reply(phrases["error.general"], Colors.Red);
    return;
  }
  await D1Class.updateDiscordSetting(
    userRequestData,
    guild.id,
    DISCORD_SERVER_SETTINGS.WELCOME_PANEL_MESSAGE,
    newId,
  );
  await reply(phrases["success.refresh_republished"].replace("{channel}", check.channel.id));
}

// =========================================================================================================
// Button Handler
// =========================================================================================================

/**
 * The panel's Verify button: shows the verification instructions privately to whoever pressed it, with a
 * button that opens the verification modal so they can type their VRChat username/URL without writing in
 * the channel. The modal is owned by the `verification` command, so its submit routes there.
 */
async function onVerify(interaction: ButtonInteraction, phrases: Phrases): Promise<void> {
  const { container, file } = buildVerifyVideo(
    phrases["verify.description"],
    phrases["verify.gotovrchat"],
    buildOpenModalButton(phrases["modal.open"]),
  );
  await interaction.reply({
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    components: [container],
    files: [file],
  });
}

// =========================================================================================================
// Main
// =========================================================================================================

const data = new SlashCommandBuilder()
  .setName("welcomepanel")
  .setDescription("Publish and manage the server's welcome verification panel.")
  .setDescriptionLocalizations({
    [Locale.SpanishLATAM]: "Publica y administra el panel de verificación de bienvenida del servidor.",
    [Locale.SpanishES]: "Para publicar y manejar el panel de bienvenida del server, que eres el jefe.",
  })
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addSubcommand((sub) =>
    sub
      .setName(SUBCOMMAND.SEND)
      .setDescription("Publish the welcome panel in the configured channel")
      .addStringOption((opt) =>
        opt
          .setName(LANGUAGE_OPTION)
          .setDescription("Language the panel is written in (defaults to the server's language)")
          .setDescriptionLocalizations({
            [Locale.SpanishLATAM]:
              "Idioma en que se escribe el panel (por defecto, el idioma del servidor).",
            [Locale.SpanishES]:
              "El idioma del panel, tronco (si no pones nada, el del servidor).",
          })
          .setRequired(false)
          .addChoices(
            ...PANEL_LANGUAGES.map((lang) => ({ name: lang.label, value: lang.locale })),
          ),
      ),
  )
  .addSubcommand((sub) =>
    sub.setName(SUBCOMMAND.PREVIEW).setDescription("Preview the welcome panel privately (only you see it)"),
  )
  .addSubcommand((sub) =>
    sub.setName(SUBCOMMAND.REFRESH).setDescription("Update the already-published welcome panel"),
  );

async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const subcommand = interaction.options.getSubcommand();
  const phrases = localize(interaction.locale);

  // Preview is private to the manager; send/refresh post to a public channel and confirm publicly.
  await interaction.deferReply(
    subcommand === SUBCOMMAND.PREVIEW ? { flags: MessageFlags.Ephemeral } : {},
  );

  if (!interaction.guild) {
    await interaction.editReply({
      flags: MessageFlags.IsComponentsV2,
      components: [textContainer(phrases["error.no_guild"], Colors.Red)],
    });
    return;
  }

  const guild = interaction.guild;

  try {
    switch (subcommand) {
      case SUBCOMMAND.SEND:
        await runSend(interaction, guild, phrases);
        break;
      case SUBCOMMAND.PREVIEW:
        await runPreview(interaction, guild);
        break;
      case SUBCOMMAND.REFRESH:
        await runRefresh(interaction, guild, phrases);
        break;
      default:
        await interaction.editReply({
          flags: MessageFlags.IsComponentsV2,
          components: [textContainer(phrases["error.general"], Colors.Red)],
        });
        break;
    }
  } catch (error) {
    printMessage("Welcome panel command error:", String(error));
    await interaction.editReply({
      flags: MessageFlags.IsComponentsV2,
      components: [textContainer(phrases["error.general"], Colors.Red)],
    });
  }
}

async function handleButton(interaction: ButtonInteraction): Promise<void> {
  const phrases = localize(interaction.locale);
  const component = interaction.customId.slice(`${PREFIX}_`.length);

  switch (component) {
    case BUTTON.VERIFY:
      await onVerify(interaction, phrases);
      break;
    default:
      break;
  }
}

export const command: Command = { data, execute, handleButton };

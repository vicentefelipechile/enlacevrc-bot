// =========================================================================================================
// Settings Command
// =========================================================================================================
// Per-server configuration, structured as `set` / `view` / `reset`. `set` is split by input type so each
// keeps its native Discord picker: `set role`, `set channel`, `set toggle`. Each group only offers the
// variables of its own type as a closed choice list, so invalid combinations (e.g. toggling a role) can't
// be expressed. `view` renders every setting; `reset` clears one or all. Requires the Manage Guild perm.

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
import type { ChatInputCommandInteraction, Guild, GuildMember } from "discord.js";

import type { Command } from "./types.js";
import {
  DISCORD_SERVER_SETTINGS,
  SETTING_METADATA,
  SETTING_TYPE,
} from "../constants/discord-settings.js";
import type { SettingType } from "../constants/discord-settings.js";
import { createLocalizer } from "../lib/i18n.js";
import { diagnoseSettings } from "../lib/settings-diagnostics.js";
import { printMessage } from "../lib/logger.js";
import { D1Class } from "../services/d1.js";
import { buildContainer, textContainer } from "../ui/container.js";

// =========================================================================================================
// Constants
// =========================================================================================================

const SUBCOMMAND_GROUP = {
  SET: "set",
} as const;

const SUBCOMMAND = {
  ROLE: SETTING_TYPE.ROLE,
  CHANNEL: SETTING_TYPE.CHANNEL,
  TOGGLE: SETTING_TYPE.TOGGLE,
  VIEW: "view",
  RESET: "reset",
} as const;

const OPTION = {
  VARIABLE: "variable",
  ROLE: "role",
  CHANNEL: "channel",
  ENABLED: "enabled",
  SETTING: "setting",
} as const;

const RESET_ALL = "all";
const BOOL_TRUE = "1";
const BOOL_FALSE = "0";
const UNSET_VALUE = "0";

// Display labels for each setting key, shown in `set`/`reset` choice menus and the `view` output. Kept
// here (English) because choice names are part of the slash command definition, not localized at runtime.
const SETTING_LABELS: Record<string, string> = {
  [DISCORD_SERVER_SETTINGS.VERIFICATION_ROLE]: "Verification Role",
  [DISCORD_SERVER_SETTINGS.VERIFICATION_PLUS_ROLE]: "18+ Verification Role",
  [DISCORD_SERVER_SETTINGS.LOG_CHANNEL]: "Log Channel",
  [DISCORD_SERVER_SETTINGS.WELCOME_PANEL_CHANNEL]: "Welcome Panel Channel",
  [DISCORD_SERVER_SETTINGS.PROFILE_SEND_CHANNEL]: "Profile Send Channel",
  [DISCORD_SERVER_SETTINGS.AUTO_NICKNAME]: "Auto Nickname",
  [DISCORD_SERVER_SETTINGS.WELCOME_PING_ENABLED]: "Welcome Ping",
};

/** Setting keys of a given input type, used to build each `set` group's closed choice list. */
function keysOfType(type: SettingType): string[] {
  return SETTING_METADATA.filter((m) => m.type === type).map((m) => m.key);
}

/** Builds {name,value} choices (value = the raw setting key) for every setting of a given type. */
function choicesOfType(type: SettingType): { name: string; value: string }[] {
  return keysOfType(type).map((key) => ({ name: SETTING_LABELS[key] ?? key, value: key }));
}

const localize = createLocalizer({
  [Locale.EnglishUS]: {
    "error.general": "An error occurred while processing the settings. Please try again later.",
    "success.role": "{label} has been set to {role}.",
    "success.channel": "{label} has been set to {channel}.",
    "success.toggle": "{label} has been {status}.",
    "success.reset": '"{label}" has been reset successfully.',
    "success.reset_all": "All server settings have been reset successfully.",
    "status.enabled": "enabled",
    "status.disabled": "disabled",
    "view.title": "Server Settings - {serverName}",
    "view.description": "Current bot configuration for this server:",
    "view.not_set": "Not set",
    "view.enabled": "Enabled",
    "view.disabled": "Disabled",
    "diag.title": "Diagnostics",
    "diag.all_ok": "✅ Everything configured is working correctly.",
    "diag.role_missing": "the configured role no longer exists.",
    "diag.no_manage_roles": 'I lack the "Manage Roles" permission, so I can\'t assign this role.',
    "diag.role_hierarchy": "my highest role is below {role}; move my role above it.",
    "diag.channel_missing": "the configured channel no longer exists.",
    "diag.channel_not_text": "the configured channel isn't a text channel.",
    "diag.channel_no_view": "I can't view the configured channel.",
    "diag.channel_no_send": "I can't send messages in the configured channel.",
    "diag.no_manage_nicknames":
      'I lack the "Manage Nicknames" permission, so nicknames won\'t update.',
    "diag.ping_without_panel":
      "the welcome ping is enabled but no Welcome Panel Channel is set, so it will never fire.",
  },
  [Locale.SpanishLATAM]: {
    "error.general":
      "Ocurrió un error al procesar la configuración. Por favor, inténtalo de nuevo más tarde.",
    "success.role": "{label} ha sido establecido como {role}.",
    "success.channel": "{label} ha sido establecido como {channel}.",
    "success.toggle": "{label} ha sido {status}.",
    "success.reset": 'La configuración "{label}" ha sido restablecida exitosamente.',
    "success.reset_all": "Todas las configuraciones del servidor han sido restablecidas exitosamente.",
    "status.enabled": "habilitado",
    "status.disabled": "deshabilitado",
    "view.title": "Configuración del Servidor - {serverName}",
    "view.description": "Configuración actual del bot para este servidor:",
    "view.not_set": "No establecido",
    "view.enabled": "Habilitado",
    "view.disabled": "Deshabilitado",
    "diag.title": "Diagnóstico",
    "diag.all_ok": "✅ Todo lo configurado está funcionando correctamente.",
    "diag.role_missing": "el rol configurado ya no existe.",
    "diag.no_manage_roles":
      'No tengo el permiso "Gestionar Roles", así que no puedo asignar este rol.',
    "diag.role_hierarchy": "mi rol más alto está por debajo de {role}; mueve mi rol por encima.",
    "diag.channel_missing": "el canal configurado ya no existe.",
    "diag.channel_not_text": "el canal configurado no es un canal de texto.",
    "diag.channel_no_view": "no puedo ver el canal configurado.",
    "diag.channel_no_send": "no puedo enviar mensajes en el canal configurado.",
    "diag.no_manage_nicknames":
      'No tengo el permiso "Gestionar Apodos", así que los apodos no se actualizarán.',
    "diag.ping_without_panel":
      "el ping de bienvenida está activado pero no hay Canal del Panel de Bienvenida configurado, así que nunca se activará.",
  },
  [Locale.SpanishES]: {
    "error.general":
      "¡Madre mía, qué movida! Algo ha fallado con la configuración. Prueba otra vez en un rato, colega.",
    "success.role": "¡De lujo! {label} ahora es {role}, como Dios manda.",
    "success.channel": "¡Hecho! {label} ahora es {channel}, tronco.",
    "success.toggle": "{label} está {status}, chaval.",
    "success.reset": 'El ajuste "{label}" se ha reseteado que da gusto.',
    "success.reset_all": "¡Menuda limpieza! Todos los ajustes del servidor han vuelto a cero, como nuevos.",
    "status.enabled": "activado, como debe ser",
    "status.disabled": "desactivado, que tampoco pasa nada",
    "view.title": "Ajustes del Server - {serverName}",
    "view.description": "Aquí tienes toda la configuración del bot para este antro, colega:",
    "view.not_set": "Ni puesto, macho",
    "view.enabled": "Activado",
    "view.disabled": "Desactivado",
    "diag.title": "Diagnóstico, colega",
    "diag.all_ok": "✅ ¡Todo niquelado! No hay nada roto por aquí.",
    "diag.role_missing": "el rol que pusiste ya no existe, macho.",
    "diag.no_manage_roles":
      'No tengo el permiso de "Gestionar Roles", así que no puedo dar ese rol, chaval.',
    "diag.role_hierarchy": "mi rol está por debajo de {role}; súbeme por encima o no llego.",
    "diag.channel_missing": "el canal que pusiste ya no existe, tronco.",
    "diag.channel_not_text": "ese canal no es de texto, ¿qué me cuentas?",
    "diag.channel_no_view": "no veo el canal ese ni de coña.",
    "diag.channel_no_send": "no puedo escribir en ese canal, colega.",
    "diag.no_manage_nicknames":
      'No tengo el permiso de "Gestionar Apodos", así que los apodos se quedan como están.',
    "diag.ping_without_panel":
      "el ping de bienvenida está activado pero no has puesto Canal del Panel, así que no hará nada de nada.",
  },
});

// =========================================================================================================
// Types
// =========================================================================================================

type Phrases = ReturnType<typeof localize>;

// =========================================================================================================
// Helpers
// =========================================================================================================

/** Formats a role mention for display, or the "not set" phrase when absent/unknown. */
function formatRole(roleId: string | undefined, guild: Guild, phrases: Phrases): string {
  if (!roleId || roleId === UNSET_VALUE) {
    return phrases["view.not_set"];
  }
  return guild.roles.cache.has(roleId) ? `<@&${roleId}>` : phrases["view.not_set"];
}

/** Formats a channel mention for display, or the "not set" phrase when absent/unknown. */
function formatChannel(channelId: string | undefined, guild: Guild, phrases: Phrases): string {
  if (!channelId || channelId === UNSET_VALUE) {
    return phrases["view.not_set"];
  }
  return guild.channels.cache.has(channelId) ? `<#${channelId}>` : phrases["view.not_set"];
}

/** Formats a boolean ("1"/"0") setting for display. */
function formatBoolean(value: string | undefined, phrases: Phrases): string {
  if (value === BOOL_TRUE) {
    return phrases["view.enabled"];
  }
  if (value === BOOL_FALSE) {
    return phrases["view.disabled"];
  }
  return phrases["view.not_set"];
}

/**
 * Renders the diagnostics section shown under the settings list in `/settings view`: one line per finding,
 * prefixed with ❌ (error) or ⚠️ (warning) and the affected setting's label, or a single "all clear" line
 * when nothing is wrong. Kept separate from `formatValue` because it summarizes live state, not stored values.
 */
function buildDiagnosticsSection(
  guild: Guild,
  botMember: GuildMember,
  settings: Record<string, string>,
  phrases: Phrases,
): string {
  const diagnostics = diagnoseSettings(guild, botMember, settings, phrases);

  const header = `**${phrases["diag.title"]}**`;
  if (diagnostics.length === 0) {
    return `${header}\n${phrases["diag.all_ok"]}`;
  }

  const lines = diagnostics.map((d) => {
    const icon = d.level === "error" ? "❌" : "⚠️";
    const label = SETTING_LABELS[d.key] ?? d.key;
    return `${icon} **${label}:** ${d.message}`;
  });

  return `${header}\n${lines.join("\n")}`;
}

/** Renders a single stored setting value according to its declared input type. */
function formatValue(
  type: SettingType,
  value: string | undefined,
  guild: Guild,
  phrases: Phrases,
): string {
  switch (type) {
    case SETTING_TYPE.ROLE:
      return formatRole(value, guild, phrases);
    case SETTING_TYPE.CHANNEL:
      return formatChannel(value, guild, phrases);
    case SETTING_TYPE.TOGGLE:
      return formatBoolean(value, phrases);
  }
}

// =========================================================================================================
// Main
// =========================================================================================================

const data = new SlashCommandBuilder()
  .setName("settings")
  .setDescription("Configure bot settings for this server.")
  .setDescriptionLocalizations({
    [Locale.SpanishLATAM]: "Configura los ajustes del bot para este servidor.",
    [Locale.SpanishES]: "Para configurar el bot en este server, que eres el mandamás.",
  })
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addSubcommandGroup((group) =>
    group
      .setName(SUBCOMMAND_GROUP.SET)
      .setDescription("Set a server setting")
      .addSubcommand((sub) =>
        sub
          .setName(SUBCOMMAND.ROLE)
          .setDescription("Set a role-type setting")
          .addStringOption((opt) =>
            opt
              .setName(OPTION.VARIABLE)
              .setDescription("Which role setting to change")
              .setRequired(true)
              .addChoices(...choicesOfType(SETTING_TYPE.ROLE)),
          )
          .addRoleOption((opt) =>
            opt.setName(OPTION.ROLE).setDescription("The role to assign").setRequired(true),
          ),
      )
      .addSubcommand((sub) =>
        sub
          .setName(SUBCOMMAND.CHANNEL)
          .setDescription("Set a channel-type setting")
          .addStringOption((opt) =>
            opt
              .setName(OPTION.VARIABLE)
              .setDescription("Which channel setting to change")
              .setRequired(true)
              .addChoices(...choicesOfType(SETTING_TYPE.CHANNEL)),
          )
          .addChannelOption((opt) =>
            opt.setName(OPTION.CHANNEL).setDescription("The channel to assign").setRequired(true),
          ),
      )
      .addSubcommand((sub) =>
        sub
          .setName(SUBCOMMAND.TOGGLE)
          .setDescription("Enable or disable a toggle-type setting")
          .addStringOption((opt) =>
            opt
              .setName(OPTION.VARIABLE)
              .setDescription("Which toggle setting to change")
              .setRequired(true)
              .addChoices(...choicesOfType(SETTING_TYPE.TOGGLE)),
          )
          .addBooleanOption((opt) =>
            opt.setName(OPTION.ENABLED).setDescription("Enable or disable it").setRequired(true),
          ),
      ),
  )
  .addSubcommand((sub) => sub.setName(SUBCOMMAND.VIEW).setDescription("View current server settings"))
  .addSubcommand((sub) =>
    sub
      .setName(SUBCOMMAND.RESET)
      .setDescription("Reset a specific setting (or all of them)")
      .addStringOption((opt) =>
        opt
          .setName(OPTION.SETTING)
          .setDescription("The setting to reset")
          .setRequired(true)
          .addChoices(
            ...SETTING_METADATA.map((m) => ({ name: SETTING_LABELS[m.key] ?? m.key, value: m.key })),
            { name: "All Settings", value: RESET_ALL },
          ),
      ),
  );

async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const phrases = localize(interaction.locale);

  const reply = (content: string, color: number = Colors.Green): Promise<unknown> =>
    interaction.editReply({
      flags: MessageFlags.IsComponentsV2,
      components: [textContainer(content, color)],
    });

  if (!interaction.guild) {
    await reply(phrases["error.general"], Colors.Red);
    return;
  }

  const guild = interaction.guild;
  const serverId = guild.id;
  const group = interaction.options.getSubcommandGroup(false);
  const subcommand = interaction.options.getSubcommand();
  const userRequestData = {
    discord_id: interaction.user.id,
    discord_name: interaction.user.username,
  };

  try {
    // `set role | channel | toggle`: the variable option carries the setting key directly.
    if (group === SUBCOMMAND_GROUP.SET) {
      const key = interaction.options.getString(OPTION.VARIABLE, true);
      const label = SETTING_LABELS[key] ?? key;

      switch (subcommand) {
        case SUBCOMMAND.ROLE: {
          const role = interaction.options.getRole(OPTION.ROLE, true);
          await D1Class.updateDiscordSetting(userRequestData, serverId, key, role.id);
          await reply(
            phrases["success.role"].replace("{label}", label).replace("{role}", `<@&${role.id}>`),
          );
          break;
        }
        case SUBCOMMAND.CHANNEL: {
          const channel = interaction.options.getChannel(OPTION.CHANNEL, true);
          await D1Class.updateDiscordSetting(userRequestData, serverId, key, channel.id);
          await reply(
            phrases["success.channel"]
              .replace("{label}", label)
              .replace("{channel}", `<#${channel.id}>`),
          );
          break;
        }
        case SUBCOMMAND.TOGGLE: {
          const enabled = interaction.options.getBoolean(OPTION.ENABLED, true);
          await D1Class.updateDiscordSetting(
            userRequestData,
            serverId,
            key,
            enabled ? BOOL_TRUE : BOOL_FALSE,
          );
          const status = enabled ? phrases["status.enabled"] : phrases["status.disabled"];
          await reply(phrases["success.toggle"].replace("{label}", label).replace("{status}", status));
          break;
        }
        default:
          await reply(phrases["error.general"], Colors.Red);
          break;
      }
      return;
    }

    switch (subcommand) {
      case SUBCOMMAND.VIEW: {
        const settings = await D1Class.getAllDiscordSettings(userRequestData, serverId);
        const lines = SETTING_METADATA.map((m) => {
          const label = SETTING_LABELS[m.key] ?? m.key;
          return `**${label}:** ${formatValue(m.type, settings[m.key], guild, phrases)}`;
        });

        // Beyond the stored values, run a live check so config that can't actually work (role too low,
        // channel unsendable, ping without a panel) is surfaced here instead of failing silently later.
        const botMember = await guild.members.fetchMe();
        const diagnostics = buildDiagnosticsSection(guild, botMember, settings, phrases);

        const description = `${phrases["view.description"]}\n\n${lines.join("\n")}\n\n${diagnostics}`;

        await interaction.editReply({
          flags: MessageFlags.IsComponentsV2,
          components: [
            buildContainer({
              color: Colors.Blue,
              title: phrases["view.title"].replace("{serverName}", guild.name),
              description,
              thumbnail: guild.iconURL() ?? undefined,
            }),
          ],
        });
        break;
      }

      case SUBCOMMAND.RESET: {
        const settingToReset = interaction.options.getString(OPTION.SETTING, true);

        if (settingToReset === RESET_ALL) {
          for (const m of SETTING_METADATA) {
            await D1Class.updateDiscordSetting(userRequestData, serverId, m.key, UNSET_VALUE);
          }
          await reply(phrases["success.reset_all"]);
          break;
        }

        await D1Class.updateDiscordSetting(userRequestData, serverId, settingToReset, UNSET_VALUE);
        const label = SETTING_LABELS[settingToReset] ?? settingToReset;
        await reply(phrases["success.reset"].replace("{label}", label));
        break;
      }

      default:
        await reply(phrases["error.general"], Colors.Red);
        break;
    }
  } catch (error) {
    printMessage("Settings command error:", String(error));
    await reply(phrases["error.general"], Colors.Red);
  }
}

export const command: Command = { data, execute };

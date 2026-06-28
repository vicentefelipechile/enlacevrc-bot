// =========================================================================================================
// Settings Command
// =========================================================================================================
// Lets server managers configure the bot: verification role, 18+ role, auto-nickname, log channel, plus
// view and reset subcommands. Requires the Manage Guild permission.

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
import type { ChatInputCommandInteraction, Guild } from "discord.js";

import type { Command } from "./types.js";
import { DISCORD_SERVER_SETTINGS } from "../constants/discord-settings.js";
import { createLocalizer } from "../lib/i18n.js";
import { printMessage } from "../lib/logger.js";
import { D1Class } from "../services/d1.js";
import { buildContainer, textContainer } from "../ui/container.js";


// =========================================================================================================
// Constants
// =========================================================================================================

const SUBCOMMAND = {
  VERIFICATION_ROLE: DISCORD_SERVER_SETTINGS.VERIFICATION_ROLE,
  VERIFICATION_PLUS_ROLE: DISCORD_SERVER_SETTINGS.VERIFICATION_PLUS_ROLE,
  AUTO_NICKNAME: DISCORD_SERVER_SETTINGS.AUTO_NICKNAME,
  LOG_CHANNEL: DISCORD_SERVER_SETTINGS.LOG_CHANNEL,
  VIEW: "view",
  RESET: "reset",
} as const;

const RESET_ALL = "all";
const RESET_VALUE = "0";
const BOOL_TRUE = "1";

// Maps a reset choice value to the setting key it clears.
const RESET_CHOICES: { name: string; value: string; key: string }[] = [
  { name: "Verified Role", value: "verification_role", key: DISCORD_SERVER_SETTINGS.VERIFICATION_ROLE },
  {
    name: "Verified 18+ Role",
    value: "verification_plus_role",
    key: DISCORD_SERVER_SETTINGS.VERIFICATION_PLUS_ROLE,
  },
  { name: "Auto Nickname", value: "auto_nickname", key: DISCORD_SERVER_SETTINGS.AUTO_NICKNAME },
  { name: "Log Channel", value: "log_channel", key: DISCORD_SERVER_SETTINGS.LOG_CHANNEL },
  { name: "All Settings", value: RESET_ALL, key: RESET_ALL },
];

const localize = createLocalizer({
  [Locale.EnglishUS]: {
    "error.permission": 'You need the "Manage Server" permission to use this command.',
    "error.general": "An error occurred while processing the settings. Please try again later.",
    "success.verification_role": "Verification role has been set to {role}.",
    "success.verification_plus_role": "18+ verification role has been set to {role}.",
    "success.auto_nickname": "Auto nickname update has been {status}.",
    "success.log_channel": "Log channel has been set to {channel}.",
    "success.reset": 'Setting "{setting}" has been reset successfully.',
    "success.reset_all": "All server settings have been reset successfully.",
    "status.enabled": "enabled",
    "status.disabled": "disabled",
    "view.title": "Server Settings - {serverName}",
    "view.description": "Current bot configuration for this server:",
    "view.verification_role": "Verification Role:",
    "view.verification_plus_role": "18+ Verification Role:",
    "view.auto_nickname": "Auto Nickname:",
    "view.log_channel": "Log Channel:",
    "view.not_set": "Not set",
    "view.enabled": "Enabled",
    "view.disabled": "Disabled",
    "reset.verification_role": "Verification Role",
    "reset.verification_plus_role": "18+ Verification Role",
    "reset.auto_nickname": "Auto Nickname",
    "reset.log_channel": "Log Channel",
  },
  [Locale.SpanishLATAM]: {
    "error.permission": 'Necesitas el permiso "Administrar Servidor" para usar este comando.',
    "error.general":
      "Ocurrió un error al procesar la configuración. Por favor, inténtalo de nuevo más tarde.",
    "success.verification_role": "El rol de verificación ha sido establecido como {role}.",
    "success.verification_plus_role": "El rol de verificación +18 ha sido establecido como {role}.",
    "success.auto_nickname": "La actualización automática de apodos ha sido {status}.",
    "success.log_channel": "El canal de log ha sido establecido como {channel}.",
    "success.reset": 'La configuración "{setting}" ha sido restablecida exitosamente.',
    "success.reset_all": "Todas las configuraciones del servidor han sido restablecidas exitosamente.",
    "status.enabled": "habilitada",
    "status.disabled": "deshabilitada",
    "view.title": "Configuración del Servidor - {serverName}",
    "view.description": "Configuración actual del bot para este servidor:",
    "view.verification_role": "Rol de Verificación:",
    "view.verification_plus_role": "Rol de Verificación +18:",
    "view.auto_nickname": "Apodo Automático:",
    "view.log_channel": "Canal de Log:",
    "view.not_set": "No establecido",
    "view.enabled": "Habilitado",
    "view.disabled": "Deshabilitado",
    "reset.verification_role": "Rol de Verificación",
    "reset.verification_plus_role": "Rol de Verificación +18",
    "reset.auto_nickname": "Apodo Automático",
    "reset.log_channel": "Canal de Log",
  },
  [Locale.SpanishES]: {
    "error.permission":
      '¡A ver, tronco! Necesitas el permiso de "Administrar Servidor" para meter mano aquí.',
    "error.general":
      "¡Madre mía, qué movida! Algo ha fallado con la configuración. Prueba otra vez en un rato, colega.",
    "success.verification_role": "¡De lujo! El rol de verificación ahora es {role}, como Dios manda.",
    "success.verification_plus_role": "¡Canelita en rama! El rol de verificación +18 ahora es {role}.",
    "success.auto_nickname": "La actualización automática de apodos está {status}, chaval.",
    "success.log_channel": "¡Hecho! El canal de log ahora es {channel}, tronco.",
    "success.reset": 'El ajuste "{setting}" se ha reseteado que da gusto.',
    "success.reset_all": "¡Menuda limpieza! Todos los ajustes del servidor han vuelto a cero, como nuevos.",
    "status.enabled": "activada, como debe ser",
    "status.disabled": "desactivada, que tampoco pasa nada",
    "view.title": "Ajustes del Server - {serverName}",
    "view.description": "Aquí tienes toda la configuración del bot para este antro, colega:",
    "view.verification_role": "Rol de Verificación:",
    "view.verification_plus_role": "Rol de Verificación +18:",
    "view.auto_nickname": "Apodo Automático:",
    "view.log_channel": "Canal de Log:",
    "view.not_set": "Ni puesto, macho",
    "view.enabled": "Activado",
    "view.disabled": "Desactivado",
    "reset.verification_role": "Rol de Verificación",
    "reset.verification_plus_role": "Rol de Verificación +18",
    "reset.auto_nickname": "Apodo Automático",
    "reset.log_channel": "Canal de Log",
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
  if (!roleId) {
    return phrases["view.not_set"];
  }
  return guild.roles.cache.has(roleId) ? `<@&${roleId}>` : phrases["view.not_set"];
}

/** Formats a channel mention for display, or the "not set" phrase when absent/unknown. */
function formatChannel(channelId: string | undefined, guild: Guild, phrases: Phrases): string {
  if (!channelId) {
    return phrases["view.not_set"];
  }
  return guild.channels.cache.has(channelId) ? `<#${channelId}>` : phrases["view.not_set"];
}

/** Formats a boolean ("1"/"0") setting for display. */
function formatBoolean(value: string | undefined, phrases: Phrases): string {
  if (value === BOOL_TRUE) {
    return phrases["view.enabled"];
  }
  if (value === RESET_VALUE) {
    return phrases["view.disabled"];
  }
  return phrases["view.not_set"];
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
  .addSubcommand((sub) =>
    sub
      .setName(SUBCOMMAND.VERIFICATION_ROLE)
      .setDescription("Set the role given to verified users")
      .addRoleOption((opt) =>
        opt.setName("role").setDescription("The role to assign to verified users").setRequired(true),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName(SUBCOMMAND.VERIFICATION_PLUS_ROLE)
      .setDescription("Set the role given to 18+ verified users")
      .addRoleOption((opt) =>
        opt
          .setName("role")
          .setDescription("The role to assign to 18+ verified users")
          .setRequired(true),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName(SUBCOMMAND.AUTO_NICKNAME)
      .setDescription("Enable/disable automatic nickname updates from VRChat")
      .addBooleanOption((opt) =>
        opt.setName("enabled").setDescription("Enable or disable auto nickname updates").setRequired(true),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName(SUBCOMMAND.LOG_CHANNEL)
      .setDescription("Set the channel where bot actions will be logged")
      .addChannelOption((opt) =>
        opt.setName("channel").setDescription("The channel to log bot actions").setRequired(true),
      ),
  )
  .addSubcommand((sub) => sub.setName(SUBCOMMAND.VIEW).setDescription("View current server settings"))
  .addSubcommand((sub) =>
    sub
      .setName(SUBCOMMAND.RESET)
      .setDescription("Reset a specific setting")
      .addStringOption((opt) =>
        opt
          .setName("setting")
          .setDescription("The setting to reset")
          .setRequired(true)
          .addChoices(...RESET_CHOICES.map(({ name, value }) => ({ name, value }))),
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
  const subcommand = interaction.options.getSubcommand();
  const userRequestData = {
    discord_id: interaction.user.id,
    discord_name: interaction.user.username,
  };

  try {
    switch (subcommand) {
      case SUBCOMMAND.VERIFICATION_ROLE: {
        const role = interaction.options.getRole("role", true);
        await D1Class.updateDiscordSetting(
          userRequestData,
          serverId,
          SUBCOMMAND.VERIFICATION_ROLE,
          role.id,
        );
        await reply(phrases["success.verification_role"].replace("{role}", `<@&${role.id}>`));
        break;
      }

      case SUBCOMMAND.VERIFICATION_PLUS_ROLE: {
        const role = interaction.options.getRole("role", true);
        await D1Class.updateDiscordSetting(
          userRequestData,
          serverId,
          SUBCOMMAND.VERIFICATION_PLUS_ROLE,
          role.id,
        );
        await reply(phrases["success.verification_plus_role"].replace("{role}", `<@&${role.id}>`));
        break;
      }

      case SUBCOMMAND.AUTO_NICKNAME: {
        const enabled = interaction.options.getBoolean("enabled", true);
        const value = enabled ? BOOL_TRUE : RESET_VALUE;
        await D1Class.updateDiscordSetting(
          userRequestData,
          serverId,
          SUBCOMMAND.AUTO_NICKNAME,
          value,
        );
        const status = enabled ? phrases["status.enabled"] : phrases["status.disabled"];
        await reply(phrases["success.auto_nickname"].replace("{status}", status));
        break;
      }

      case SUBCOMMAND.LOG_CHANNEL: {
        const channel = interaction.options.getChannel("channel", true);
        await D1Class.updateDiscordSetting(
          userRequestData,
          serverId,
          SUBCOMMAND.LOG_CHANNEL,
          channel.id,
        );
        await reply(phrases["success.log_channel"].replace("{channel}", `<#${channel.id}>`));
        break;
      }

      case SUBCOMMAND.VIEW: {
        const settings = await D1Class.getAllDiscordSettings(userRequestData, serverId);
        const description =
          `${phrases["view.description"]}\n\n` +
          `**${phrases["view.verification_role"]}** ` +
          `${formatRole(settings[SUBCOMMAND.VERIFICATION_ROLE], guild, phrases)}\n` +
          `**${phrases["view.verification_plus_role"]}** ` +
          `${formatRole(settings[SUBCOMMAND.VERIFICATION_PLUS_ROLE], guild, phrases)}\n` +
          `**${phrases["view.auto_nickname"]}** ` +
          `${formatBoolean(settings[SUBCOMMAND.AUTO_NICKNAME], phrases)}\n` +
          `**${phrases["view.log_channel"]}** ` +
          `${formatChannel(settings[SUBCOMMAND.LOG_CHANNEL], guild, phrases)}`;

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
        const settingToReset = interaction.options.getString("setting", true);

        if (settingToReset === RESET_ALL) {
          await D1Class.updateDiscordSetting(
            userRequestData,
            serverId,
            DISCORD_SERVER_SETTINGS.AUTO_NICKNAME,
            RESET_VALUE,
          );
          await D1Class.updateDiscordSetting(
            userRequestData,
            serverId,
            DISCORD_SERVER_SETTINGS.VERIFICATION_ROLE,
            RESET_VALUE,
          );
          await D1Class.updateDiscordSetting(
            userRequestData,
            serverId,
            DISCORD_SERVER_SETTINGS.VERIFICATION_PLUS_ROLE,
            RESET_VALUE,
          );
          await D1Class.updateDiscordSetting(
            userRequestData,
            serverId,
            DISCORD_SERVER_SETTINGS.LOG_CHANNEL,
            RESET_VALUE,
          );
          await reply(phrases["success.reset_all"]);
          break;
        }

        const choice = RESET_CHOICES.find((c) => c.value === settingToReset);
        if (choice) {
          await D1Class.updateDiscordSetting(userRequestData, serverId, choice.key, RESET_VALUE);
        }
        const resetLabel = phrases[`reset.${settingToReset}` as keyof Phrases] ?? settingToReset;
        await reply(phrases["success.reset"].replace("{setting}", resetLabel));
        break;
      }

      default:
        await reply(phrases["error.general"], Colors.Red);
        break;
    }
  } catch (error) {
    // Bug fix: the original referenced the non-existent key `error.error`; use `error.general`.
    printMessage("Settings command error:", String(error));
    await reply(phrases["error.general"], Colors.Red);
  }
}

export const command: Command = { data, execute };

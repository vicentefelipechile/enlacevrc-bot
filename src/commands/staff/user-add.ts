// =========================================================================================================
// /staff user add
// =========================================================================================================
// Links a Discord user with a VRChat profile: validates the VRChat ID, ensures neither side is already
// linked, fetches the VRChat user, creates the profile and applies the server's verification role /
// auto-nickname settings.

// =========================================================================================================
// Imports
// =========================================================================================================

import { Colors, EmbedBuilder, Locale } from "discord.js";
import type {
  ChatInputCommandInteraction,
  SlashCommandSubcommandGroupBuilder,
} from "discord.js";

import { DISCORD_SERVER_SETTINGS } from "../../constants/discord-settings.js";
import { createLocalizer } from "../../lib/i18n.js";
import { printMessage } from "../../lib/logger.js";
import { getVRChatId } from "../../lib/vrchat-code.js";
import { D1Class } from "../../services/d1.js";
import { VRCHAT_CLIENT } from "../../services/vrchat.js";
import type { UserRequestData } from "../../types/models.js";
import { staffRequestData } from "./permissions.js";

// =========================================================================================================
// Constants
// =========================================================================================================

export const NAME = "add";

const VRCHAT_ID_REGEX = /^usr_[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const AUTO_NICKNAME_ENABLED = "1";

const localize = createLocalizer({
  [Locale.EnglishUS]: {
    "error.invalid_vrchat_id":
      "Invalid VRChat ID format. The VRChat ID must have the format: `usr_XXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX`",
    "error.profile_exists": "This VRChat profile is already linked to a Discord account.",
    "error.user_exists": "This Discord user is already verified with a VRChat account.",
    "error.vrchat_not_found":
      "Could not find a VRChat user with the ID `{vrchat_id}`. Please verify the ID is correct.",
    "error.general": "An error occurred while trying to add the user. Please try again later.",
    checking_profile: "🔍 Checking if the profile already exists...",
    fetching_vrchat: "🔍 Fetching VRChat user information...",
    creating_profile: "📝 Creating new profile...",
    "success.title": "✅ User Added Successfully",
    "success.description": "The user has been successfully linked to their VRChat profile.",
    "success.field.discord": "Discord User",
    "success.field.vrchat": "VRChat User",
    "success.field.vrchat_id": "VRChat ID",
  },
  [Locale.SpanishLATAM]: {
    "error.invalid_vrchat_id":
      "Formato de VRChat ID inválido. El VRChat ID debe tener el formato: `usr_XXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX`",
    "error.profile_exists": "Este perfil de VRChat ya está vinculado a una cuenta de Discord.",
    "error.user_exists": "Este usuario de Discord ya está verificado con una cuenta de VRChat.",
    "error.vrchat_not_found":
      "No se pudo encontrar un usuario de VRChat con el ID `{vrchat_id}`. Por favor, verifica que el ID sea correcto.",
    "error.general":
      "Ocurrió un error al intentar agregar el usuario. Por favor, inténtalo de nuevo más tarde.",
    checking_profile: "🔍 Verificando si el perfil ya existe...",
    fetching_vrchat: "🔍 Obteniendo información del usuario de VRChat...",
    creating_profile: "📝 Creando nuevo perfil...",
    "success.title": "✅ Usuario Agregado Exitosamente",
    "success.description": "El usuario ha sido vinculado exitosamente a su perfil de VRChat.",
    "success.field.discord": "Usuario de Discord",
    "success.field.vrchat": "Usuario de VRChat",
    "success.field.vrchat_id": "ID de VRChat",
  },
  [Locale.SpanishES]: {
    "error.invalid_vrchat_id":
      "¡Pero mira que eres torpe! El formato del VRChat ID está mal. Tiene que ser: `usr_XXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX`",
    "error.profile_exists": "¡Anda ya! Este perfil de VRChat ya está pillado por otra cuenta de Discord.",
    "error.user_exists": "¡Oye, que este usuario de Discord ya está verificado con una cuenta de VRChat!",
    "error.vrchat_not_found":
      "¡Joder! No hay ni dios en VRChat con el ID `{vrchat_id}`. Revisa que lo has puesto bien, anda.",
    "error.general": "¡Ay madre! Algo ha petao al intentar agregar al usuario. Dale un rato y prueba otra vez.",
    checking_profile: "🔍 Mirando a ver si el perfil ya existe...",
    fetching_vrchat: "🔍 Pillando la info del usuario de VRChat...",
    creating_profile: "📝 Creando el perfil nuevo...",
    "success.title": "✅ ¡Usuario Agregado, A Tope!",
    "success.description": "El pavo este ya está vinculado con su perfil de VRChat, crack.",
    "success.field.discord": "Usuario de Discord",
    "success.field.vrchat": "Usuario de VRChat",
    "success.field.vrchat_id": "ID de VRChat",
  },
});

// =========================================================================================================
// Types
// =========================================================================================================

/** Subset of the VRChat user object this subcommand reads. */
interface VRChatUser {
  displayName?: string;
  profilePicOverride?: string;
  currentAvatarImageUrl?: string;
}

// =========================================================================================================
// Helpers
// =========================================================================================================

/** True when the string matches the canonical VRChat user ID format. */
function isValidVRChatId(vrchatId: string): boolean {
  return VRCHAT_ID_REGEX.test(vrchatId);
}

/** Returns true when a profile exists for the given key, swallowing the not-found error. */
async function profileExists(userRequestData: UserRequestData, key: string): Promise<boolean> {
  try {
    await D1Class.getProfile(userRequestData, key, false);
    return true;
  } catch {
    return false;
  }
}

/** Applies the server's verification role and auto-nickname settings to the linked member. */
async function applyServerSettings(
  interaction: ChatInputCommandInteraction,
  userRequestData: UserRequestData,
  memberId: string,
  displayName: string,
): Promise<void> {
  const guild = interaction.guild;
  if (!guild) {
    return;
  }

  const settings = await D1Class.getAllDiscordSettings(userRequestData, guild.id);
  const member = await guild.members.fetch(memberId);

  const verificationRoleId = settings[DISCORD_SERVER_SETTINGS.VERIFICATION_ROLE];
  if (verificationRoleId) {
    const role = guild.roles.cache.get(verificationRoleId);
    if (role) {
      await member.roles.add(role);
    }
  }

  if (settings[DISCORD_SERVER_SETTINGS.AUTO_NICKNAME] === AUTO_NICKNAME_ENABLED) {
    try {
      await member.setNickname(displayName);
    } catch {
      // Ignore nickname errors (e.g. the target outranks the bot).
    }
  }
}

// =========================================================================================================
// Main
// =========================================================================================================

/** Adds the `add` subcommand to the `user` group. */
export function build(group: SlashCommandSubcommandGroupBuilder): SlashCommandSubcommandGroupBuilder {
  return group.addSubcommand((sub) =>
    sub
      .setName(NAME)
      .setDescription("Link a Discord user with their VRChat profile.")
      .setDescriptionLocalizations({
        [Locale.SpanishLATAM]: "Vincula un usuario de Discord con su perfil de VRChat.",
        [Locale.SpanishES]: "Vincula a un pavo de Discord con su perfil de VRChat, tronco.",
      })
      .addUserOption((opt) =>
        opt.setName("user").setDescription("The Discord user to link.").setRequired(true),
      )
      .addStringOption((opt) =>
        opt
          .setName("vrchat_id")
          .setDescription("The VRChat user ID (format: usr_XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX).")
          .setRequired(true),
      ),
  );
}

/** Runs `/staff user add`. The staff gate has already passed in the router. */
export async function run(interaction: ChatInputCommandInteraction): Promise<void> {
  const phrases = localize(interaction.locale);

  if (!interaction.guild) {
    await interaction.editReply({ content: phrases["error.general"] });
    return;
  }

  const discordUser = interaction.options.getUser("user", true);
  const rawVrchatId = interaction.options.getString("vrchat_id", true);
  const sanitizedVRChatId = getVRChatId(rawVrchatId);

  if (!sanitizedVRChatId || !isValidVRChatId(sanitizedVRChatId)) {
    await interaction.editReply({ content: phrases["error.invalid_vrchat_id"] });
    return;
  }

  const userRequestData = staffRequestData(interaction.user.id, interaction.user.username);

  try {
    await interaction.editReply({ content: phrases.checking_profile });

    if (await profileExists(userRequestData, sanitizedVRChatId)) {
      await interaction.editReply({ content: phrases["error.profile_exists"] });
      return;
    }

    if (await profileExists(userRequestData, discordUser.id)) {
      await interaction.editReply({ content: phrases["error.user_exists"] });
      return;
    }

    await interaction.editReply({ content: phrases.fetching_vrchat });

    const vrchatResponse = await VRCHAT_CLIENT.getUser({ path: { userId: sanitizedVRChatId } });
    const vrchatData = vrchatResponse.data as unknown as VRChatUser;

    if (!vrchatData.displayName) {
      await interaction.editReply({
        content: phrases["error.vrchat_not_found"].replace("{vrchat_id}", sanitizedVRChatId),
      });
      return;
    }

    await interaction.editReply({ content: phrases.creating_profile });

    await D1Class.createProfile(userRequestData, {
      vrchat_id: sanitizedVRChatId,
      discord_id: discordUser.id,
      vrchat_name: vrchatData.displayName,
    });

    await applyServerSettings(interaction, userRequestData, discordUser.id, vrchatData.displayName);

    const successEmbed = new EmbedBuilder()
      .setColor(Colors.Green)
      .setTitle(phrases["success.title"])
      .setDescription(phrases["success.description"])
      .addFields(
        { name: phrases["success.field.discord"], value: `<@${discordUser.id}>`, inline: true },
        {
          name: phrases["success.field.vrchat"],
          value: `[${vrchatData.displayName}](https://vrchat.com/home/user/${sanitizedVRChatId})`,
          inline: true,
        },
        { name: phrases["success.field.vrchat_id"], value: `\`${sanitizedVRChatId}\``, inline: false },
      )
      .setThumbnail(vrchatData.profilePicOverride ?? vrchatData.currentAvatarImageUrl ?? null)
      .setTimestamp();

    await interaction.editReply({ content: null, embeds: [successEmbed] });
  } catch (error) {
    printMessage("staff user add error:", String(error));
    await interaction.editReply({ content: phrases["error.general"] });
  }
}

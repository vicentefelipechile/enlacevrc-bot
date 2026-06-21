// =========================================================================================================
// Verification Command
// =========================================================================================================
// Lets a user link their Discord account to a VRChat profile via a bio code, and unlink it. Exports two
// commands: `verification` (the flow, with verify/unverify/cancel/profile buttons) and `howtoverify`
// (a short instructional video). Button state (the pending VRChat id) is held in a short-lived cache.

// =========================================================================================================
// Imports
// =========================================================================================================

import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  Colors,
  ContainerBuilder,
  EmbedBuilder,
  Locale,
  MediaGalleryBuilder,
  MessageFlags,
  SlashCommandBuilder,
  TextDisplayBuilder,
} from "discord.js";
import type { ButtonInteraction, ChatInputCommandInteraction, GuildMember } from "discord.js";
import NodeCache from "node-cache";

import type { Command } from "./types.js";
import { createLocalizer } from "../lib/i18n.js";
import { printMessage } from "../lib/logger.js";
import { generateCodeByVRChat, getVRChatId } from "../lib/vrchat-code.js";
import { D1Class } from "../services/d1.js";
import { VRCHAT_CLIENT } from "../services/vrchat.js";

// =========================================================================================================
// Constants
// =========================================================================================================

const VRCHAT_URL = "https://vrchat.com/home";
const VERIFY_VIDEO_FILE = "img/verify.webm";
const VERIFY_VIDEO_NAME = "verify.webm";
const CODE_CACHE_TTL_SECONDS = 5 * 60;
const AUTO_NICKNAME_ENABLED = "1";

// Button component ids (the part after the `verification_` prefix in the custom id).
const BUTTON = {
  VERIFY: "verify",
  UNVERIFY: "unverify",
  CANCEL: "cancelaction",
  PROFILE: "profile",
} as const;

const PREFIX = "verification";
const customId = (component: string): string => `${PREFIX}_${component}`;

// Holds the pending VRChat id per user between issuing the code and pressing Verify.
const pendingVerifications = new NodeCache({ stdTTL: CODE_CACHE_TTL_SECONDS });

const localize = createLocalizer({
  [Locale.EnglishUS]: {
    "error.banned_unverify": "You are banned and cannot unverify your account.",
    "error.no_profile": "You do not have a linked VRChat profile.",
    "error.timeout":
      "Verification timed out. Please run the command again.",
    "error.code_not_found":
      "The verification code was not found in your VRChat bio. Please make sure you have added it correctly and press the button again.",
    "error.vrchat_not_found": "Could not find a user on VRChat with the ID `{id}`.",
    "embed.title": "VRChat Account Verification",
    "embed.description":
      'To verify your account, please follow these steps:\n\n1. Copy the following code:\n```{code}```\n2. Paste the code anywhere in your VRChat bio.\n3. Press the "Verify" button below.',
    "embed.footer": "This button will expire in 5 minutes.",
    "verification.verify": "Verify",
    "verification.cancelaction": "Cancel",
    "unverify.description":
      "You are already verified. Would you like to unlink your VRChat account?",
    "unverify.button": "Unverify",
    "unverify.success": "Your account has been successfully unverified.",
    "unverify.error": "An error occurred while trying to unverify your account.",
    "verify.description":
      "# Verification\n\nTo verify your account, you need to provide the URL to your VRChat profile as a command argument.",
    "verify.gotovrchat": "Go to VRChat",
    success: "Congratulations! Your account has been successfully verified.",
    cancelled: "Verification cancelled.",
  },
  [Locale.SpanishLATAM]: {
    "error.banned_unverify": "Estás baneado y no puedes desverificar tu cuenta.",
    "error.no_profile": "No tienes un perfil de VRChat vinculado.",
    "error.timeout": "La verificación ha expirado. Por favor, ejecuta el comando de nuevo.",
    "error.code_not_found":
      "No se encontró el código de verificación en tu biografía de VRChat. Asegúrate de haberlo añadido correctamente y presiona el botón de nuevo.",
    "error.vrchat_not_found":
      "No se pudo encontrar un usuario en VRChat con el ID `{id}`. Por favor, revisa que esté bien escrito.",
    "embed.title": "Verificación de Cuenta de VRChat",
    "embed.description":
      'Para verificar tu cuenta, por favor sigue estos pasos:\n\n1. Copia el siguiente código:\n```{code}```\n2. Pega el código en cualquier parte de tu biografía de VRChat.\n3. Presiona el botón "Verificar" que aparece a continuación.',
    "embed.footer": "Este botón expirará en 5 minutos.",
    "verification.verify": "Verificar",
    "verification.cancelaction": "Cancelar",
    "unverify.description":
      "Ya te encuentras verificado. ¿Deseas desvincular tu cuenta de VRChat?",
    "unverify.button": "Desverificar",
    "unverify.success": "Tu cuenta ha sido desverificada exitosamente.",
    "unverify.error": "Ocurrió un error al intentar desverificar tu cuenta.",
    "verify.description":
      "# Verificación\n\nPara verificar tu cuenta tienes que proporcionar la URL a tu perfil de VRChat como argumento del comando.",
    "verify.gotovrchat": "Ir a VRChat",
    success: "¡Felicidades! Tu cuenta ha sido verificada exitosamente.",
    cancelled: "Verificación cancelada.",
  },
  [Locale.SpanishES]: {
    "error.banned_unverify": "Estás baneado, colega. No puedes quitar la verificación ni de coña.",
    "error.no_profile": "Que no tienes perfil vinculado, alma de cántaro.",
    "error.timeout": "¡Se te ha pasado el arroz! La verificación ha caducado. Tira el comando de nuevo.",
    "error.code_not_found":
      "¿Pero dónde está el código? Que no lo veo en tu biografía, me cago en la leche. Asegúrate de que lo has pegado bien y dale al botón otra vez.",
    "error.vrchat_not_found":
      "Que no, que con el ID `{id}` no hay ni dios en VRChat. Revisa que lo has puesto bien.",
    "embed.title": "Verificación de la Cuenta de VRChat, ¡al turrón!",
    "embed.description":
      'Venga, para verificarte, haz esto que es pan comido:\n\n1. Pilla el código este:\n```{code}```\n2. Lo plantas en cualquier sitio de tu biografía de VRChat.\n3. Le das al botón de "Verificar" de aquí abajo y a correr.',
    "embed.footer": "Ojo, que el botón este se autodestruye en 5 minutos.",
    "verification.verify": "¡Verificar!",
    "verification.cancelaction": "Cancelar, que me he liado",
    "unverify.description":
      "A ver, que ya estás verificado. ¿Seguro que quieres quitar el vínculo con tu cuenta de VRChat?",
    "unverify.button": "Sí, quitarla",
    "unverify.success": "¡Listo! Tu cuenta ya no está verificada. A otra cosa, mariposa.",
    "unverify.error": "¡Hostia! Algo ha fallado al intentar quitar la verificación.",
    "verify.description":
      "# Verificación\n\nPara verificarte, tienes que soltar la URL de tu perfil de VRChat en el comando, ¿vale?",
    "verify.gotovrchat": "Ir a VRChat",
    success: "¡Enhorabuena, crack! Tu cuenta está verificada. ¡A tope!",
    cancelled: "Pues nada, verificación cancelada. Tú te lo pierdes.",
  },
});

// =========================================================================================================
// Types
// =========================================================================================================

type Phrases = ReturnType<typeof localize>;

interface PendingVerification {
  vrchat_id: string;
}

interface VRChatUser {
  bio?: string;
  displayName: string;
}

// =========================================================================================================
// Helpers
// =========================================================================================================

function verifyVideoAttachment(): AttachmentBuilder {
  return new AttachmentBuilder(VERIFY_VIDEO_FILE, { name: VERIFY_VIDEO_NAME });
}

/** Builds the instructional video container shared by the profile button and howtoverify command. */
function buildVideoContainer(phrases: Phrases): {
  container: ContainerBuilder;
  file: AttachmentBuilder;
} {
  const file = verifyVideoAttachment();
  const gotoButton = new ButtonBuilder()
    .setStyle(ButtonStyle.Link)
    .setURL(VRCHAT_URL)
    .setEmoji("🔗")
    .setLabel(phrases["verify.gotovrchat"]);

  const container = new ContainerBuilder()
    .setAccentColor(Colors.Aqua)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(phrases["verify.description"]))
    .addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems({ media: { url: `attachment://${VERIFY_VIDEO_NAME}` } }),
    )
    .addActionRowComponents(new ActionRowBuilder<ButtonBuilder>().addComponents(gotoButton));

  return { container, file };
}

function verifyButton(phrases: Phrases): ButtonBuilder {
  return new ButtonBuilder()
    .setCustomId(customId(BUTTON.VERIFY))
    .setLabel(phrases["verification.verify"])
    .setStyle(ButtonStyle.Success)
    .setEmoji("✅");
}

function unverifyButton(phrases: Phrases): ButtonBuilder {
  return new ButtonBuilder()
    .setCustomId(customId(BUTTON.UNVERIFY))
    .setLabel(phrases["unverify.button"])
    .setStyle(ButtonStyle.Danger)
    .setEmoji("🗑️");
}

function cancelButton(phrases: Phrases): ButtonBuilder {
  return new ButtonBuilder()
    .setCustomId(customId(BUTTON.CANCEL))
    .setLabel(phrases["verification.cancelaction"])
    .setStyle(ButtonStyle.Secondary)
    .setEmoji("⏹️");
}

// =========================================================================================================
// Button Handlers
// =========================================================================================================

async function onVerify(interaction: ButtonInteraction, phrases: Phrases): Promise<void> {
  await interaction.deferUpdate();

  const discordId = interaction.user.id;
  const cached = pendingVerifications.get<PendingVerification>(discordId);
  if (!cached) {
    await interaction.editReply({ content: phrases["error.timeout"], embeds: [], components: [] });
    return;
  }

  const userRequestData = { discord_id: discordId, discord_name: interaction.user.username };
  const vrchatResponse = await VRCHAT_CLIENT.getUser({ path: { userId: cached.vrchat_id } });
  const vrchatData = vrchatResponse.data as unknown as VRChatUser;
  const code = generateCodeByVRChat(cached.vrchat_id);

  if (!vrchatData.bio?.includes(code)) {
    await interaction.followUp({
      content: phrases["error.code_not_found"],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  await D1Class.createProfile(userRequestData, {
    discord_id: discordId,
    vrchat_id: cached.vrchat_id,
    vrchat_name: vrchatData.displayName,
  });

  if (interaction.guild && interaction.member) {
    const settings = await D1Class.getAllDiscordSettings(userRequestData, interaction.guild.id);
    const member = interaction.member as GuildMember;

    if (settings["auto_nickname"] === AUTO_NICKNAME_ENABLED) {
      await member.setNickname(vrchatData.displayName).catch(() => undefined);
    }

    const verificationRoleId = settings["verification_role"];
    const verificationRole = verificationRoleId
      ? interaction.guild.roles.cache.get(verificationRoleId)
      : undefined;
    if (verificationRole) {
      await member.roles.add(verificationRole).catch(() => undefined);
    }
  }

  const doneButton = verifyButton(phrases).setDisabled(true);
  await interaction.editReply({
    content: phrases.success,
    embeds: [],
    components: [new ActionRowBuilder<ButtonBuilder>().addComponents(doneButton)],
  });
}

async function onUnverify(interaction: ButtonInteraction, phrases: Phrases): Promise<void> {
  await interaction.deferUpdate();
  const userRequestData = {
    discord_id: interaction.user.id,
    discord_name: interaction.user.username,
  };

  let profileData;
  try {
    profileData = await D1Class.getProfile(userRequestData, interaction.user.id, true);
  } catch {
    await interaction.editReply({ content: phrases["error.no_profile"], embeds: [], components: [] });
    return;
  }

  if (profileData.is_banned) {
    await interaction.editReply({
      content: phrases["error.banned_unverify"],
      embeds: [],
      components: [],
    });
    return;
  }

  try {
    await D1Class.deleteProfile(userRequestData, interaction.user.id);
    const doneButton = unverifyButton(phrases).setDisabled(true);
    await interaction.editReply({
      content: phrases["unverify.success"],
      embeds: [],
      components: [new ActionRowBuilder<ButtonBuilder>().addComponents(doneButton)],
    });
  } catch (error) {
    printMessage("Unverification error:", String(error));
    await interaction.editReply({
      content: phrases["unverify.error"],
      embeds: [],
      components: [],
    });
  }
}

async function onCancel(interaction: ButtonInteraction, phrases: Phrases): Promise<void> {
  await interaction.deferUpdate();
  await interaction.editReply({ content: phrases.cancelled, embeds: [], components: [] });
}

async function onProfile(interaction: ButtonInteraction, phrases: Phrases): Promise<void> {
  await interaction.deferUpdate();
  const { container, file } = buildVideoContainer(phrases);
  await interaction.editReply({
    flags: MessageFlags.IsComponentsV2,
    components: [container],
    files: [file],
  });
}

// =========================================================================================================
// Main — verification command
// =========================================================================================================

const verificationData = new SlashCommandBuilder()
  .setName("verification")
  .setDescription("Verify your account by linking it to your VRChat profile.")
  .setDescriptionLocalizations({
    [Locale.SpanishLATAM]: "Verifica tu cuenta vinculándola con tu perfil de VRChat.",
    [Locale.SpanishES]: "Verifica tu cuenta, que esto es más fácil que freír un huevo, tronco.",
  })
  .addStringOption((opt) =>
    opt.setName("vrchat").setDescription("Your VRChat profile URL.").setRequired(false),
  );

async function executeVerification(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const phrases = localize(interaction.locale);
  const userRequestData = {
    discord_id: interaction.user.id,
    discord_name: interaction.user.username,
  };

  let profileData;
  try {
    profileData = await D1Class.getProfile(userRequestData, interaction.user.id, true);
  } catch {
    profileData = null;
  }

  // Already verified: offer to unverify.
  if (profileData) {
    const embed = new EmbedBuilder()
      .setColor(Colors.Red)
      .setTitle(phrases["embed.title"])
      .setDescription(phrases["unverify.description"]);
    await interaction.editReply({
      embeds: [embed],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          unverifyButton(phrases),
          cancelButton(phrases),
        ),
      ],
    });
    return;
  }

  // No VRChat id supplied: show the instructional video.
  const rawVrchat = interaction.options.getString("vrchat");
  const vrchatId = rawVrchat ? getVRChatId(rawVrchat) : null;
  if (!vrchatId) {
    const { container, file } = buildVideoContainer(phrases);
    await interaction.editReply({
      flags: MessageFlags.IsComponentsV2,
      components: [container],
      files: [file],
    });
    return;
  }

  const verificationCode = generateCodeByVRChat(vrchatId);
  pendingVerifications.set<PendingVerification>(interaction.user.id, { vrchat_id: vrchatId });

  const embed = new EmbedBuilder()
    .setColor(Colors.Aqua)
    .setTitle(phrases["embed.title"])
    .setDescription(phrases["embed.description"].replace("{code}", verificationCode))
    .setFooter({ text: phrases["embed.footer"] });

  await interaction.editReply({
    embeds: [embed],
    components: [
      new ActionRowBuilder<ButtonBuilder>().addComponents(verifyButton(phrases), cancelButton(phrases)),
    ],
  });
}

async function handleVerificationButton(interaction: ButtonInteraction): Promise<void> {
  const phrases = localize(interaction.locale);
  const component = interaction.customId.slice(`${PREFIX}_`.length);

  switch (component) {
    case BUTTON.VERIFY:
      await onVerify(interaction, phrases);
      break;
    case BUTTON.UNVERIFY:
      await onUnverify(interaction, phrases);
      break;
    case BUTTON.CANCEL:
      await onCancel(interaction, phrases);
      break;
    case BUTTON.PROFILE:
      await onProfile(interaction, phrases);
      break;
    default:
      break;
  }
}

const verificationCommand: Command = {
  data: verificationData,
  execute: executeVerification,
  handleButton: handleVerificationButton,
};

// =========================================================================================================
// Main — howtoverify command
// =========================================================================================================

const howToVerifyData = new SlashCommandBuilder()
  .setName("howtoverify")
  .setDescription("Instructions on how to verify your VRChat account with Discord.")
  .setDescriptionLocalizations({
    [Locale.SpanishLATAM]: "Instrucciones sobre cómo verificar tu cuenta de VRChat con Discord.",
    [Locale.SpanishES]: "Instrucciones para verificar tu cuenta de VRChat con Discord, ¡fácil y rápido!",
  });

async function executeHowToVerify(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();
  const phrases = localize(interaction.locale);
  const { container, file } = buildVideoContainer(phrases);
  await interaction.editReply({
    flags: MessageFlags.IsComponentsV2,
    components: [container],
    files: [file],
  });
}

const howToVerifyCommand: Command = { data: howToVerifyData, execute: executeHowToVerify };

// =========================================================================================================
// Exports
// =========================================================================================================

export const commands: Command[] = [verificationCommand, howToVerifyCommand];

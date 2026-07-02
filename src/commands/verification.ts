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
  Locale,
  MessageFlags,
  ModalBuilder,
  SectionBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  SlashCommandBuilder,
  TextDisplayBuilder,
  TextInputBuilder,
  TextInputStyle,
  ThumbnailBuilder,
} from "discord.js";
import type {
  ButtonInteraction,
  ChatInputCommandInteraction,
  GuildMember,
  ModalSubmitInteraction,
  RepliableInteraction,
} from "discord.js";
import NodeCache from "node-cache";

import type { Command } from "./types.js";
import { DISCORD_SERVER_SETTINGS } from "../constants/discord-settings.js";
import { createLocalizer } from "../lib/i18n.js";
import { printMessage } from "../lib/logger.js";
import { generateCodeByVRChat, getVRChatId } from "../lib/vrchat-code.js";
import { D1Class } from "../services/d1.js";
import { VRCHAT_CLIENT } from "../services/vrchat.js";
import { textContainer } from "../ui/container.js";
import { sendProfileToChannel } from "../ui/profile-message.js";
import { buildVerifyVideo } from "../ui/verify-video.js";

// =========================================================================================================
// Constants
// =========================================================================================================

const VRCHAT_URL = "https://vrchat.com/home";
const CODE_CACHE_TTL_SECONDS = 5 * 60;
const AUTO_NICKNAME_ENABLED = "1";

// How many username search candidates to walk the user through before giving up.
const MAX_PROFILE_CANDIDATES = 3;

// Verification method id recorded when the bot auto-verifies a user whose VRChat age is verified.
// Shares the staff id since the outcome (+18 access) is identical.
const BOT_VERIFICATION_ID = 1;

// Button component ids (the part after the `verification_` prefix in the custom id).
const BUTTON = {
  VERIFY: "verify",
  UNVERIFY: "unverify",
  CANCEL: "cancelaction",
  PROFILE: "profile",
  // Opens the modal that lets the user type their VRChat username/URL without writing in the channel.
  OPEN_MODAL: "openmodal",
  // Username-candidate confirmation step: confirm this profile is mine / show the next candidate.
  CONFIRM_PROFILE: "confirmprofile",
  REJECT_PROFILE: "rejectprofile",
} as const;

// Modal (and its single text input) ids, also prefixed so the router dispatches them to this command.
const MODAL = {
  INPUT: "vrchatinput",
} as const;
const MODAL_ID = "verification_modal";

const PREFIX = "verification";
const customId = (component: string): string => `${PREFIX}_${component}`;

// Holds the pending VRChat id per user between issuing the code and pressing Verify.
const pendingVerifications = new NodeCache({ stdTTL: CODE_CACHE_TTL_SECONDS });

// Holds the username-search candidates a user is walking through (until they confirm or run out).
const pendingCandidates = new NodeCache({ stdTTL: CODE_CACHE_TTL_SECONDS });

const localize = createLocalizer({
  [Locale.EnglishUS]: {
    "error.banned_unverify": "You are banned and cannot unverify your account.",
    "error.no_profile": "You do not have a linked VRChat profile.",
    "error.timeout":
      "Verification timed out. Please run the command again.",
    "error.code_not_found":
      "The verification code was not found in your VRChat bio. Please make sure you have added it correctly and press the button again.",
    "error.vrchat_not_found": "Could not find a user on VRChat with the ID `{id}`.",
    "error.username_not_found": "Could not find a user on VRChat with the name `{name}`.",
    "error.profile_not_confirmed":
      "I couldn't find your profile. Double-check the characters of your profile or use your profile link.",
    "candidate.question": "Is this your profile? **({current}/{total})**",
    "candidate.profile": "### [{name}]({url})\nVRChat profile",
    "candidate.confirm": "It's my profile",
    "candidate.reject": "No, that's not me",
    "embed.title": "VRChat Account Verification",
    "embed.description":
      'To verify your account, please follow these steps:\n\n1. Copy the following code:\n```{code}```\n2. Paste the code anywhere in your VRChat bio.\n3. Press the "Verify" button below.',
    "embed.footer": "This verification code will expire in 5 minutes.",
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
    "modal.open": "Enter username or URL",
    "modal.title": "Verify your VRChat account",
    "modal.label": "VRChat username or profile URL",
    "modal.placeholder": "Enter your VRChat username or profile URL here",
    "modal.empty": "You didn't enter anything. Please try again.",
    success: "Congratulations! Your account has been successfully verified.",
    "success.age_verified":
      "\n\nYour VRChat age is verified, so you have also been granted **+18 verification** automatically. Verified by {bot}.",
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
    "error.username_not_found":
      "No se pudo encontrar un usuario en VRChat con el nombre `{name}`. Por favor, revisa que esté bien escrito.",
    "error.profile_not_confirmed":
      "No pude encontrar tu perfil, revisa bien los caracteres de tu perfil o utiliza el enlace de tu perfil.",
    "candidate.question": "¿Este es tu perfil? **({current}/{total})**",
    "candidate.profile": "### [{name}]({url})\nPerfil de VRChat",
    "candidate.confirm": "Es mi perfil",
    "candidate.reject": "No, no soy yo",
    "embed.title": "Verificación de Cuenta de VRChat",
    "embed.description":
      'Para verificar tu cuenta, por favor sigue estos pasos:\n\n1. Copia el siguiente código:\n```{code}```\n2. Pega el código en cualquier parte de tu biografía de VRChat.\n3. Presiona el botón "Verificar" que aparece a continuación.',
    "embed.footer": "Este código de verificación expirará en 5 minutos.",
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
    "modal.open": "Introduce tu usuario o URL",
    "modal.title": "Verifica tu cuenta de VRChat",
    "modal.label": "Usuario o URL de tu perfil de VRChat",
    "modal.placeholder": "Introduce aquí tu nombre de usuario o URL de VRChat",
    "modal.empty": "No introdujiste nada. Por favor, inténtalo de nuevo.",
    success: "¡Felicidades! Tu cuenta ha sido verificada exitosamente.",
    "success.age_verified":
      "\n\nTu edad en VRChat está verificada, así que también se te otorgó la **verificación +18** automáticamente. Verificado por {bot}.",
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
    "error.username_not_found":
      "Que no, que con el nombre `{name}` no hay ni dios en VRChat. Revisa que lo has puesto bien.",
    "error.profile_not_confirmed":
      "Pues nada, que no doy con tu perfil, chaval. Mira bien las letras de tu perfil o pega el enlace directamente, que es más fácil.",
    "candidate.question": "¿Este es tu perfil, colega? **({current}/{total})**",
    "candidate.profile": "### [{name}]({url})\nPerfil de VRChat",
    "candidate.confirm": "¡Ese soy yo!",
    "candidate.reject": "Qué va, no soy yo",
    "embed.title": "Verificación de la Cuenta de VRChat, ¡al turrón!",
    "embed.description":
      'Venga, para verificarte, haz esto que es pan comido:\n\n1. Pilla el código este:\n```{code}```\n2. Lo plantas en cualquier sitio de tu biografía de VRChat.\n3. Le das al botón de "Verificar" de aquí abajo y a correr.',
    "embed.footer": "Ojo, que este código se autodestruye en 5 minutos.",
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
    "modal.open": "Pon tu usuario o la URL",
    "modal.title": "Verifica tu cuenta de VRChat, ¡venga!",
    "modal.label": "Tu usuario o la URL de tu perfil de VRChat",
    "modal.placeholder": "Suelta aquí tu nombre de usuario o la URL, colega",
    "modal.empty": "¡Pero si no has puesto nada, chaval! Prueba otra vez, anda.",
    success: "¡Enhorabuena, crack! Tu cuenta está verificada. ¡A tope!",
    "success.age_verified":
      "\n\n¡Y ojo! Que tu edad en VRChat está verificada, así que te has llevao la **verificación +18** de regalo, sin comerlo ni beberlo. Verificado por {bot}, ¡olé!",
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
  id: string;
  bio?: string;
  displayName: string;
  ageVerified?: boolean;
  profilePicOverride?: string;
  currentAvatarImageUrl?: string;
}

/** A username-search candidate the user is being asked to confirm. */
interface ProfileCandidate {
  id: string;
  displayName: string;
  avatarUrl?: string;
}

/** The candidate walk-through state cached per user between confirm/reject presses. */
interface PendingCandidates {
  candidates: ProfileCandidate[];
  index: number;
}

// =========================================================================================================
// Helpers
// =========================================================================================================

/**
 * Builds the button that opens the verification modal. Exported so the welcome panel can offer the same
 * "type your username/URL" entry point under this command's prefix (routing the modal back here).
 */
export function buildOpenModalButton(label: string): ButtonBuilder {
  return new ButtonBuilder()
    .setCustomId(customId(BUTTON.OPEN_MODAL))
    .setLabel(label)
    .setStyle(ButtonStyle.Primary)
    .setEmoji("📝");
}

/** Builds the modal that asks for a VRChat username or profile URL. */
function buildVerifyModal(phrases: Phrases): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(MODAL_ID)
    .setTitle(phrases["modal.title"])
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId(MODAL.INPUT)
          .setLabel(phrases["modal.label"])
          .setPlaceholder(phrases["modal.placeholder"])
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(128),
      ),
    );
}

/** Builds the instructional video container shared by the profile button and howtoverify command. */
function buildVideoContainer(phrases: Phrases): {
  container: ContainerBuilder;
  file: AttachmentBuilder;
} {
  return buildVerifyVideo(
    phrases["verify.description"],
    phrases["verify.gotovrchat"],
    buildOpenModalButton(phrases["modal.open"]),
  );
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

/**
 * Builds the Components V2 container asking the user whether the candidate at `state.index` is their
 * profile, with "It's my profile" / "No, that's not me" buttons. Shown when verifying by username.
 */
function buildCandidateContainer(
  state: PendingCandidates,
  phrases: Phrases,
): ContainerBuilder {
  const candidate = state.candidates[state.index]!;
  const profileUrl = `${VRCHAT_URL}/user/${candidate.id}`;
  const question = phrases["candidate.question"]
    .replace("{current}", String(state.index + 1))
    .replace("{total}", String(state.candidates.length));
  const profile = phrases["candidate.profile"]
    .replace("{name}", candidate.displayName)
    .replace("{url}", profileUrl);

  const container = new ContainerBuilder()
    .setAccentColor(Colors.Aqua)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(question))
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
    );

  // Name/link beside a compact avatar thumbnail; falls back to a plain text block when there's no
  // avatar (a Section requires an accessory, so only use one when an image is available).
  if (candidate.avatarUrl) {
    container.addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(profile))
        .setThumbnailAccessory(new ThumbnailBuilder().setURL(candidate.avatarUrl)),
    );
  } else {
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(profile));
  }

  const confirm = new ButtonBuilder()
    .setCustomId(customId(BUTTON.CONFIRM_PROFILE))
    .setLabel(phrases["candidate.confirm"])
    .setStyle(ButtonStyle.Success)
    .setEmoji("✅");
  const reject = new ButtonBuilder()
    .setCustomId(customId(BUTTON.REJECT_PROFILE))
    .setLabel(phrases["candidate.reject"])
    .setStyle(ButtonStyle.Danger)
    .setEmoji("❌");

  container
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
    )
    .addActionRowComponents(
      new ActionRowBuilder<ButtonBuilder>().addComponents(confirm, reject),
    );
  return container;
}

/** Builds the Components V2 container that issues the bio code for a confirmed VRChat id. */
function buildCodeContainer(vrchatId: string, phrases: Phrases): ContainerBuilder {
  const verificationCode = generateCodeByVRChat(vrchatId);
  return new ContainerBuilder()
    .setAccentColor(Colors.Aqua)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `## ${phrases["embed.title"]}\n\n` +
          phrases["embed.description"].replace("{code}", verificationCode),
      ),
    )
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${phrases["embed.footer"]}`))
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
    )
    .addActionRowComponents(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setStyle(ButtonStyle.Link)
          .setURL(VRCHAT_URL)
          .setEmoji("🔗")
          .setLabel(phrases["verify.gotovrchat"]),
      ),
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
    )
    .addActionRowComponents(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        verifyButton(phrases),
        cancelButton(phrases),
      ),
    );
}

// =========================================================================================================
// Button Handlers
// =========================================================================================================

/** Edits the interaction reply to a single-text Components V2 message, clearing any prior components. */
async function replyText(
  interaction: ButtonInteraction,
  content: string,
  color: number = Colors.Aqua,
): Promise<void> {
  await interaction.editReply({
    flags: MessageFlags.IsComponentsV2,
    components: [textContainer(content, color)],
  });
}

async function onVerify(interaction: ButtonInteraction, phrases: Phrases): Promise<void> {
  await interaction.deferUpdate();

  const discordId = interaction.user.id;
  const cached = pendingVerifications.get<PendingVerification>(discordId);
  if (!cached) {
    await replyText(interaction, phrases["error.timeout"]);
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

  // When VRChat reports the user's age as verified, the bot itself grants definitive +18 verification:
  // it records the profile as verified (with the bot as the responsible party) and reports it below.
  let ageVerifiedGranted = false;

  if (interaction.guild && interaction.member) {
    const settings = await D1Class.getAllDiscordSettings(userRequestData, interaction.guild.id);
    const member = interaction.member as GuildMember;

    if (settings[DISCORD_SERVER_SETTINGS.AUTO_NICKNAME] === AUTO_NICKNAME_ENABLED) {
      await member.setNickname(vrchatData.displayName).catch(() => undefined);
    }

    const verificationRoleId = settings[DISCORD_SERVER_SETTINGS.VERIFICATION_ROLE];
    const verificationRole = verificationRoleId
      ? interaction.guild.roles.cache.get(verificationRoleId)
      : undefined;
    if (verificationRole) {
      await member.roles.add(verificationRole).catch(() => undefined);
    }

    if (vrchatData.ageVerified) {
      // The bot is the responsible party for this automatic verification.
      const botRequestData = {
        discord_id: interaction.client.user.id,
        discord_name: interaction.client.user.username,
      };

      const verificationPlusRoleId = settings[DISCORD_SERVER_SETTINGS.VERIFICATION_PLUS_ROLE];
      const verificationPlusRole = verificationPlusRoleId
        ? interaction.guild.roles.cache.get(verificationPlusRoleId)
        : undefined;
      if (verificationPlusRole) {
        await member.roles.add(verificationPlusRole).catch(() => undefined);
      }

      try {
        await D1Class.verifyProfile(botRequestData, discordId, {
          verification_id: BOT_VERIFICATION_ID,
          verified_from: interaction.guild.id,
        });
        ageVerifiedGranted = true;
      } catch (error) {
        printMessage("Automatic age verification error:", String(error));
      }
    }

    // The member just linked their profile here, so post it to the profile-send channel if one is set.
    // Failures are swallowed inside the helper; a posting problem must not derail the success reply below.
    await sendProfileToChannel(interaction.guild, userRequestData, discordId, settings);
  }

  const successMessage = ageVerifiedGranted
    ? phrases.success +
      phrases["success.age_verified"].replace("{bot}", interaction.client.user.username)
    : phrases.success;

  const doneButton = verifyButton(phrases).setDisabled(true);
  const doneRow = new ActionRowBuilder<ButtonBuilder>().addComponents(doneButton);

  await interaction.editReply({
    flags: MessageFlags.IsComponentsV2,
    components: [
      new ContainerBuilder()
        .setAccentColor(Colors.Green)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(successMessage))
        .addActionRowComponents(doneRow),
    ],
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
    await replyText(interaction, phrases["error.no_profile"], Colors.Red);
    return;
  }

  if (profileData.is_banned) {
    await replyText(interaction, phrases["error.banned_unverify"], Colors.Red);
    return;
  }

  try {
    await D1Class.deleteProfile(userRequestData, interaction.user.id);
    const doneButton = unverifyButton(phrases).setDisabled(true);
    await interaction.editReply({
      flags: MessageFlags.IsComponentsV2,
      components: [
        new ContainerBuilder()
          .setAccentColor(Colors.Green)
          .addTextDisplayComponents(new TextDisplayBuilder().setContent(phrases["unverify.success"]))
          .addActionRowComponents(
            new ActionRowBuilder<ButtonBuilder>().addComponents(doneButton),
          ),
      ],
    });
  } catch (error) {
    printMessage("Unverification error:", String(error));
    await replyText(interaction, phrases["unverify.error"], Colors.Red);
  }
}

async function onCancel(interaction: ButtonInteraction, phrases: Phrases): Promise<void> {
  await interaction.deferUpdate();
  await replyText(interaction, phrases.cancelled);
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

/** Opens the modal so the user can type their VRChat username/URL without writing in the channel. */
async function onOpenModal(interaction: ButtonInteraction, phrases: Phrases): Promise<void> {
  await interaction.showModal(buildVerifyModal(phrases));
}

/** "It's my profile": the user confirmed the current candidate, so issue the bio code for it. */
async function onConfirmProfile(interaction: ButtonInteraction, phrases: Phrases): Promise<void> {
  await interaction.deferUpdate();

  const discordId = interaction.user.id;
  const state = pendingCandidates.get<PendingCandidates>(discordId);
  if (!state) {
    await replyText(interaction, phrases["error.timeout"], Colors.Red);
    return;
  }

  pendingCandidates.del(discordId);
  const candidate = state.candidates[state.index]!;
  pendingVerifications.set<PendingVerification>(discordId, { vrchat_id: candidate.id });

  await interaction.editReply({
    flags: MessageFlags.IsComponentsV2,
    components: [buildCodeContainer(candidate.id, phrases)],
  });
}

/** "No, that's not me": advance to the next candidate, or give up after the last one. */
async function onRejectProfile(interaction: ButtonInteraction, phrases: Phrases): Promise<void> {
  await interaction.deferUpdate();

  const discordId = interaction.user.id;
  const state = pendingCandidates.get<PendingCandidates>(discordId);
  if (!state) {
    await replyText(interaction, phrases["error.timeout"], Colors.Red);
    return;
  }

  const nextIndex = state.index + 1;
  if (nextIndex >= state.candidates.length) {
    pendingCandidates.del(discordId);
    await replyText(interaction, phrases["error.profile_not_confirmed"], Colors.Red);
    return;
  }

  const nextState: PendingCandidates = { candidates: state.candidates, index: nextIndex };
  pendingCandidates.set<PendingCandidates>(discordId, nextState);
  await interaction.editReply({
    flags: MessageFlags.IsComponentsV2,
    components: [buildCandidateContainer(nextState, phrases)],
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
  )
  .addStringOption((opt) =>
    opt
      .setName("username")
      .setDescription("Your VRChat username, as an alternative to your profile URL.")
      .setDescriptionLocalizations({
        [Locale.SpanishLATAM]: "Tu nombre de usuario de VRChat, como alternativa a la URL de tu perfil.",
        [Locale.SpanishES]: "Tu nombre de usuario de VRChat, por si pasas de pegar la URL, colega.",
      })
      .setRequired(false),
  );

/**
 * The shared "already verified?" gate. Edits the deferred reply with the unverify offer and returns true
 * when the user already has a linked profile, so callers can stop. Used by both the slash command and the
 * modal so neither path issues a duplicate verification.
 */
async function offerUnverifyIfLinked(
  interaction: RepliableInteraction,
  phrases: Phrases,
): Promise<boolean> {
  const userRequestData = { discord_id: interaction.user.id, discord_name: interaction.user.username };

  let profileData;
  try {
    profileData = await D1Class.getProfile(userRequestData, interaction.user.id, true);
  } catch {
    profileData = null;
  }

  if (!profileData) {
    return false;
  }

  await interaction.editReply({
    flags: MessageFlags.IsComponentsV2,
    components: [
      new ContainerBuilder()
        .setAccentColor(Colors.Red)
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `## ${phrases["embed.title"]}\n\n${phrases["unverify.description"]}`,
          ),
        )
        .addActionRowComponents(
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            unverifyButton(phrases),
            cancelButton(phrases),
          ),
        ),
    ],
  });
  return true;
}

/**
 * Resolves a free-form VRChat input (profile URL, bare id, or username) into the right next step and edits
 * the already-deferred reply accordingly: a URL/id goes straight to the bio code; a username is searched
 * and the user is asked to confirm which of up to a few candidates is theirs; nothing usable shows the
 * instructional video. Shared by the slash command and the modal submit so both behave identically.
 */
async function resolveInputAndReply(
  interaction: RepliableInteraction,
  rawInput: string | null,
  phrases: Phrases,
): Promise<void> {
  const trimmed = rawInput?.trim() ?? "";

  // No input at all: show the instructional video (with the modal entry point) so the user can act.
  if (!trimmed) {
    const { container, file } = buildVideoContainer(phrases);
    await interaction.editReply({
      flags: MessageFlags.IsComponentsV2,
      components: [container],
      files: [file],
    });
    return;
  }

  // A URL or bare id resolves to a VRChat id directly; otherwise treat the input as a username to search.
  const vrchatId = getVRChatId(trimmed);

  // Username path: names can collide, so instead of trusting the top hit we fetch up to a few candidates
  // and let the user confirm which profile is theirs before issuing a code.
  if (!vrchatId) {
    const search = await VRCHAT_CLIENT.searchUsers({
      query: { search: trimmed, n: MAX_PROFILE_CANDIDATES },
    });
    const results = search.data as unknown as VRChatUser[] | undefined;
    if (!results || results.length === 0) {
      await interaction.editReply({
        flags: MessageFlags.IsComponentsV2,
        components: [
          textContainer(
            phrases["error.username_not_found"].replace("{name}", trimmed),
            Colors.Red,
          ),
        ],
      });
      return;
    }

    const candidates: ProfileCandidate[] = results.map((user) => {
      const avatarUrl = user.profilePicOverride || user.currentAvatarImageUrl;
      return avatarUrl
        ? { id: user.id, displayName: user.displayName, avatarUrl }
        : { id: user.id, displayName: user.displayName };
    });
    const state: PendingCandidates = { candidates, index: 0 };
    pendingCandidates.set<PendingCandidates>(interaction.user.id, state);

    await interaction.editReply({
      flags: MessageFlags.IsComponentsV2,
      components: [buildCandidateContainer(state, phrases)],
    });
    return;
  }

  // URL/id path: confirmed VRChat id, issue the bio code straight away.
  pendingVerifications.set<PendingVerification>(interaction.user.id, { vrchat_id: vrchatId });
  await interaction.editReply({
    flags: MessageFlags.IsComponentsV2,
    components: [buildCodeContainer(vrchatId, phrases)],
  });
}

async function executeVerification(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const phrases = localize(interaction.locale);

  // Already verified: offer to unverify.
  if (await offerUnverifyIfLinked(interaction, phrases)) {
    return;
  }

  // Accept either option; a usable profile URL wins, otherwise fall back to the username.
  const rawVrchat = interaction.options.getString("vrchat");
  const rawUsername = interaction.options.getString("username");
  const rawInput = (rawVrchat && getVRChatId(rawVrchat) ? rawVrchat : null) ?? rawUsername ?? rawVrchat;

  await resolveInputAndReply(interaction, rawInput, phrases);
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
    case BUTTON.OPEN_MODAL:
      await onOpenModal(interaction, phrases);
      break;
    case BUTTON.CONFIRM_PROFILE:
      await onConfirmProfile(interaction, phrases);
      break;
    case BUTTON.REJECT_PROFILE:
      await onRejectProfile(interaction, phrases);
      break;
    default:
      break;
  }
}

/**
 * Handles the verification modal submit: reads the typed username/URL and runs the same resolution as the
 * slash command (URL/id → bio code; username → candidate confirmation). Replies ephemerally so the result
 * stays private to whoever opened the modal from the public welcome panel.
 */
async function handleVerificationModal(interaction: ModalSubmitInteraction): Promise<void> {
  if (interaction.customId !== MODAL_ID) {
    return;
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const phrases = localize(interaction.locale);

  // Already verified: offer to unverify instead of issuing a duplicate.
  if (await offerUnverifyIfLinked(interaction, phrases)) {
    return;
  }

  const rawInput = interaction.fields.getTextInputValue(MODAL.INPUT);
  if (!rawInput.trim()) {
    await interaction.editReply({
      flags: MessageFlags.IsComponentsV2,
      components: [textContainer(phrases["modal.empty"], Colors.Red)],
    });
    return;
  }

  await resolveInputAndReply(interaction, rawInput, phrases);
}

const verificationCommand: Command = {
  data: verificationData,
  execute: executeVerification,
  handleButton: handleVerificationButton,
  handleModal: handleVerificationModal,
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

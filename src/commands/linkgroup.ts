// =========================================================================================================
// Link Group Command
// =========================================================================================================
// Lets a server admin link a VRChat group to this Discord server via a three-step flow: invite the bot
// in VRChat, accept terms, then the bot joins the group and the link is recorded. Requires the
// Administrator permission and a configured log channel. State between button presses is held in a
// short-lived cache.

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
  PermissionFlagsBits,
  SectionBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  SlashCommandBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
} from "discord.js";
import type {
  ButtonInteraction,
  ChatInputCommandInteraction,
  TextBasedChannel,
} from "discord.js";
import NodeCache from "node-cache";

import type { Command } from "./types.js";
import { env } from "../config/env.js";
import { DISCORD_SERVER_SETTINGS } from "../constants/discord-settings.js";
import { createLocalizer } from "../lib/i18n.js";
import { printMessage } from "../lib/logger.js";
import { D1Class } from "../services/d1.js";
import { VRCHAT_CLIENT } from "../services/vrchat.js";


// =========================================================================================================
// Constants
// =========================================================================================================

const STATE_TTL_SECONDS = 5 * 60;
const PREFIX = "linkgroup";
const BUTTON = { INVITED: "invited", ACCEPT: "acceptterms", REJECT: "rejectterms" } as const;
const customId = (component: string): string => `${PREFIX}_${component}`;

const ERROR_IMAGE = { file: "img/error.jpg", name: "error.jpg" };
const WARNING_IMAGE = { file: "img/warning.jpg", name: "warning.jpg" };
const SUCCESS_IMAGE = { file: "img/success.jpg", name: "success.jpg" };

// Per-user link state held between the "invited" and "accept terms" steps.
const linkGroupState = new NodeCache({ stdTTL: STATE_TTL_SECONDS });

const localize = createLocalizer({
  [Locale.EnglishUS]: {
    "error.not_linked":
      "❌ **Account Not Linked**\n\nTo link a VRChat group, you first need to link your VRChat account with Discord.\n\n**Steps to follow:**\n1. Use the `/verification` command to start the process\n2. Follow the instructions to link your account\n3. Once linked, try `/linkgroup` again",
    "error.no_log_channel":
      "⚠️ **Log Channel Not Configured**\n\nTo ensure transparency, you need to configure a channel where all bot actions will be logged.\n\n**How to configure it:**\n1. Use the `/settings log_channel` command\n2. Select the channel where you want to receive the logs\n3. Try `/linkgroup` again",
    "error.no_log_channel_while_accepting_terms":
      "⚠️ **Log Channel Deleted**\n\nWHY, IS JUST, WHY YOU REMOVED THE LOG CHANNEL BEFORE ACCEPTING TERMS?",
    "error.log_channel_not_found":
      "❌ **Log Channel Not Found**\n\nThe configured log channel was not found.\n\n**How to fix it:**\n1. Use the `/settings log_channel` command\n2. Select the channel\n3. Try `/linkgroup` again",
    "error.no_invitations":
      '🔍 **No Invitations Found**\n\nNo pending invitation to the VRChat group was found.\n\n**Make sure you have:**\n1. Opened VRChat\n2. Gone to your group\n3. Invited the bot by its VRChat username\n4. Returned to Discord and pressed the button again',
    "error.invalid_invitation":
      "🚫 **Invalid Invitation**\n\nThe invitation found is not valid. You must be the group owner in VRChat, or have Administrator permissions in this Discord server.",
    "error.generic":
      "❌ **An Error Occurred**\n\nSomething went wrong while processing your request. Please try again later.",
    "initial.title": "🔗 Link VRChat Group",
    "initial.description":
      'To link your VRChat group with this Discord server, follow these steps:\n1. Open VRChat and go to your group\n2. Go to the "Members" section\n3. Click "Invite" and search for the bot ```{VRCHAT_APPLICATION_NAME}```\n4. Send the invitation\n5. Return here and press the button below',
    "terms.title": "📋 Terms and Conditions",
    "terms.description":
      "Before linking the bot to your VRChat group, please read and accept the following terms:",
    "terms.point1":
      "**1. The bot is a tool** The bot does not make decisions on its own. All actions are performed by users with permissions.",
    "terms.point2":
      "**2. Action logging** All actions performed will be logged in the configured log channel {log_channel}.",
    "terms.point3":
      "**3. Audit trail** Actions have an auto-incremental ID to prevent evidence tampering. A copy is also stored in the database.",
    "terms.point4":
      "**4. Responsibility** The bot owner is not responsible for misuse of the bot in the VRChat group.",
    "terms.point5": "**5. Invitation** Currently you are inviting the bot to the group ```{groupName}```",
    "success.title": "✅ Group Successfully Linked!",
    "success.description":
      "The VRChat group **{groupName}** has been successfully linked to this Discord server.\n\nAll actions performed by users with permissions will be logged in the configured channel.",
    cancelled: "Process cancelled.",
    "log.action.title": "Bot has joined the group {groupName}",
    "log.action.by": "Action made by {user}",
    "log.action.actionid": "**Group**: {vrchat_group_id}\n**Action ID**: {action_id}",
    "initial.button": "I've invited the bot",
    "linkgroup.acceptterms": "Accept",
    "linkgroup.rejectterms": "Reject",
  },
  [Locale.SpanishLATAM]: {
    "error.not_linked":
      "❌ **Cuenta No Vinculada**\n\nPara vincular un grupo de VRChat, primero debes vincular tu cuenta de VRChat con Discord.\n\n**Pasos a seguir:**\n1. Usa el comando `/verification` para iniciar el proceso\n2. Sigue las instrucciones para vincular tu cuenta\n3. Una vez vinculado, intenta `/linkgroup` nuevamente",
    "error.no_log_channel":
      "⚠️ **Canal de Registros No Configurado**\n\nPara garantizar la transparencia, necesitas configurar un canal donde se registrarán todas las acciones del bot.\n\n**Cómo configurarlo:**\n1. Usa el comando `/settings log_channel`\n2. Selecciona el canal\n3. Intenta `/linkgroup` nuevamente",
    "error.no_log_channel_while_accepting_terms":
      "⚠️ **Canal de Registros Eliminado**\n\nPERO WEON, ¿PARA QUE BORRAS EL CANAL DE LOGS?",
    "error.log_channel_not_found":
      "❌ **Canal de Registros No Encontrado**\n\nEl canal de registros configurado no se encontró.\n\n**Cómo solucionarlo:**\n1. Usa el comando `/settings log_channel`\n2. Selecciona el canal\n3. Intenta `/linkgroup` nuevamente",
    "error.no_invitations":
      "🔍 **No Se Encontraron Invitaciones**\n\nNo se encontró ninguna invitación pendiente al grupo de VRChat.\n\n**Asegúrate de haber:**\n1. Abierto VRChat\n2. Ido a tu grupo\n3. Invitado al bot por su nombre de VRChat\n4. Regresado a Discord y presionado el botón nuevamente",
    "error.invalid_invitation":
      "🚫 **Invitación No Válida**\n\nLa invitación encontrada no es válida. Debes ser el dueño del grupo en VRChat, o tener permisos de Administrador en este servidor de Discord.",
    "error.generic":
      "❌ **Ocurrió un Error**\n\nAlgo salió mal al procesar tu solicitud. Por favor, inténtalo de nuevo más tarde.",
    "initial.title": "🔗 Vincular Grupo de VRChat",
    "initial.description":
      'Para vincular tu grupo de VRChat con este servidor de Discord, sigue estos pasos:\n1. Abre VRChat y ve a tu grupo\n2. Ve a la sección "Members" (Miembros)\n3. Haz clic en "Invite" (Invitar) y busca al bot ```{VRCHAT_APPLICATION_NAME}```\n4. Envía la invitación\n5. Regresa aquí y haz clic en el botón de abajo',
    "terms.title": "📋 Términos y Condiciones",
    "terms.description":
      "Antes de vincular el bot a tu grupo de VRChat, por favor lee y acepta los siguientes términos:",
    "terms.point1":
      "**1. El bot es una herramienta** El bot no toma decisiones por sí mismo. Todas las acciones son realizadas por usuarios con permisos.",
    "terms.point2":
      "**2. Registro de acciones** Todas las acciones realizadas serán registradas en el canal {log_channel}.",
    "terms.point3":
      "**3. Trazabilidad** Las acciones tienen un ID autoincremental para evitar manipulación de evidencias. También se crea una copia en la base de datos.",
    "terms.point4":
      "**4. Responsabilidad** El dueño del bot no se responsabiliza por el mal uso del bot en el grupo de VRChat.",
    "terms.point5": "**5. Invitación** Actualmente estas invitando el bot al grupo ```{groupName}```",
    "success.title": "✅ ¡Grupo Vinculado Exitosamente!",
    "success.description":
      "El grupo de VRChat **{groupName}** ha sido vinculado exitosamente a este servidor de Discord.\n\nTodas las acciones realizadas por usuarios con permisos serán registradas en el canal configurado.",
    cancelled: "Proceso cancelado.",
    "log.action.title": "El bot se ha unido al grupo {groupName}",
    "log.action.by": "Acción realizada por {user}",
    "log.action.actionid": "**Grupo**: {vrchat_group_id}\n**ID de la acción**: {action_id}",
    "initial.button": "He invitado al bot",
    "linkgroup.acceptterms": "Aceptar",
    "linkgroup.rejectterms": "Rechazar",
  },
  [Locale.SpanishES]: {
    "error.not_linked":
      "❌ **¡Eh, Willy! Cuenta Sin Vincular**\n\n¡A ver, tronco! Para vincular un grupo de VRChat, primero tienes que vincular tu cuenta de VRChat con Discord.\n\n**Pasos a seguir:**\n1. Usa el comando `/verification` para empezar\n2. Sigue las instrucciones pa vincular tu cuenta\n3. Una vez vinculado, le das otra vez al `/linkgroup`",
    "error.no_log_channel":
      "⚠️ **¡Madre mía! Canal de Registros Sin Configurar**\n\nPara que todo quede clarito, necesitas configurar un canal donde se apuntarán todas las acciones del bot.\n\n**Cómo configurarlo:**\n1. Usa el comando `/settings log_channel`\n2. Selecciona el canal\n3. Intenta `/linkgroup` otra vez",
    "error.no_log_channel_while_accepting_terms":
      "⚠️ **¡Pero qué haces, alma de cántaro!**\n\n¿Pero tú eres tonto o qué? ¿Para qué borras el canal de logs justo cuando estás aceptando los términos?",
    "error.log_channel_not_found":
      "❌ **¡Madre mía! Canal de Registros No Encontrado**\n\nEl canal de registros configurado no se encontró, colega.\n\n**Cómo solucionarlo:**\n1. Usa el comando `/settings log_channel`\n2. Selecciona el canal\n3. Intenta `/linkgroup` otra vez",
    "error.no_invitations":
      "🔍 **¡Joder! No Hay Invitaciones**\n\nQue no encuentro ninguna invitación pendiente al grupo de VRChat, macho.\n\n**Asegúrate de haber:**\n1. Abierto VRChat\n2. Ido a tu grupo\n3. Invitado al bot por su nombre de VRChat\n4. Vuelto a Discord y dado al botón otra vez",
    "error.invalid_invitation":
      "🚫 **¡Nanay de la China! Invitación No Válida**\n\nLa invitación que he encontrado no vale. Tienes que ser el dueño del grupo en VRChat, o tener permisos de Administrador en este server de Discord.",
    "error.generic":
      "❌ **¡Hostia Puta! Ha Petado Algo**\n\nAlgo ha ido mal al procesar tu petición, tronco. Prueba otra vez más tarde.",
    "initial.title": "🔗 Vincular Grupo de VRChat",
    "initial.description":
      'Para vincular tu grupo de VRChat con este server de Discord, haz esto que es pan comido:\n1. Abre VRChat y ve a tu grupo\n2. Ve a la sección "Members" (Miembros)\n3. Dale a "Invite" (Invitar) y busca al bot ```{VRCHAT_APPLICATION_NAME}```\n4. Mándale la invitación al bot\n5. Vuelve aquí y dale al botón de abajo',
    "terms.title": "📋 Términos y Condiciones",
    "terms.description":
      "Antes de vincular el bot a tu grupo de VRChat, lee esto y acepta los términos, ¿vale?",
    "terms.point1":
      "**1. El bot es solo una herramienta** El bot no decide na por sí mismo. To las acciones las hacen usuarios con permisos.",
    "terms.point2":
      "**2. Registro de acciones** To las acciones que se hagan quedarán registradas en el canal {log_channel}.",
    "terms.point3":
      "**3. Trazabilidad** Las acciones tienen un ID autoincremental pa evitar que alguien la lie con las pruebas. También se guarda una copia en la base de datos.",
    "terms.point4":
      "**4. Responsabilidad** El dueño del bot no se hace responsable del mal uso del bot en el grupo de VRChat.",
    "terms.point5": "**5. Invitación** Actualmente estas invitando el bot al grupo ```{groupName}```",
    "success.title": "✅ ¡Grupo Vinculado, Crack!",
    "success.description":
      "El grupo de VRChat **{groupName}** se ha vinculado con éxito a este server de Discord.\n\nTo las acciones que hagan usuarios con permisos quedarán registradas en el canal configurado.",
    cancelled: "Proceso cancelado, tronco.",
    "log.action.title": "El bot se ha unido al grupo {groupName}",
    "log.action.by": "Acción realizada por {user}",
    "log.action.actionid": "**Grupo**: {vrchat_group_id}\n**ID de la acción**: {action_id}",
    "initial.button": "Ya he invitado al bot",
    "linkgroup.acceptterms": "Acepto, venga",
    "linkgroup.rejectterms": "Paso, mejor no",
  },
});

// =========================================================================================================
// Types
// =========================================================================================================

type Phrases = ReturnType<typeof localize>;

interface LinkGroupState {
  inviteId: string;
  groupId: string;
  groupName: string;
  serverId: string;
}

interface VRChatNotification {
  id: string;
  type: string;
  link: string;
}

interface VRChatGroupData {
  id: string;
  name: string;
  ownerId: string;
  iconUrl?: string;
}

// =========================================================================================================
// Helpers
// =========================================================================================================

/** Builds a Components V2 error container with a thumbnail image. */
function errorContainer(
  contentText: string,
  imageName: string,
  color: number = Colors.Red,
): ContainerBuilder {
  return new ContainerBuilder()
    .setAccentColor(color)
    .addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(contentText))
        .setThumbnailAccessory(new ThumbnailBuilder({ media: { url: `attachment://${imageName}` } })),
    );
}

function attachment(image: { file: string; name: string }): AttachmentBuilder {
  return new AttachmentBuilder(image.file, { name: image.name });
}

/** Replies with a Components V2 error message, swallowing nothing. */
async function replyError(
  interaction: ButtonInteraction | ChatInputCommandInteraction,
  text: string,
  image: { file: string; name: string },
  color: number = Colors.Red,
): Promise<void> {
  await interaction.editReply({
    components: [errorContainer(text, image.name, color)],
    files: [attachment(image)],
    flags: MessageFlags.IsComponentsV2,
  });
}

function acceptButton(phrases: Phrases): ButtonBuilder {
  return new ButtonBuilder()
    .setCustomId(customId(BUTTON.ACCEPT))
    .setLabel(phrases["linkgroup.acceptterms"])
    .setStyle(ButtonStyle.Success)
    .setEmoji("✅");
}

function rejectButton(phrases: Phrases): ButtonBuilder {
  return new ButtonBuilder()
    .setCustomId(customId(BUTTON.REJECT))
    .setLabel(phrases["linkgroup.rejectterms"])
    .setStyle(ButtonStyle.Danger)
    .setEmoji("✖️");
}

// =========================================================================================================
// Button Handlers
// =========================================================================================================

async function onInvited(interaction: ButtonInteraction, phrases: Phrases): Promise<void> {
  await interaction.deferUpdate();

  if (!interaction.guild) {
    await replyError(interaction, phrases["error.generic"], ERROR_IMAGE);
    return;
  }

  const userId = interaction.user.id;
  const guild = interaction.guild;
  const userRequestData = { discord_id: userId, discord_name: interaction.user.username };

  try {
    let profileData;
    try {
      profileData = await D1Class.getProfile(userRequestData, userId, false);
    } catch {
      await replyError(interaction, phrases["error.not_linked"], ERROR_IMAGE);
      return;
    }
    if (!profileData?.vrchat_id) {
      await replyError(interaction, phrases["error.not_linked"], ERROR_IMAGE);
      return;
    }

    const notificationsResponse = await VRCHAT_CLIENT.listNotifications();
    const groupInvites = (notificationsResponse.data as unknown as VRChatNotification[]).filter(
      (n) => n.type === "group.invite",
    );

    if (groupInvites.length === 0) {
      await replyError(interaction, phrases["error.no_invitations"], WARNING_IMAGE, Colors.Orange);
      return;
    }

    const member = guild.members.cache.get(userId);
    const isAdmin = member?.permissions.has(PermissionFlagsBits.Administrator) ?? false;

    let validInvite: VRChatNotification | null = null;
    let groupData: VRChatGroupData | null = null;

    for (const invite of groupInvites) {
      const groupId = invite.link.replace("group:", "");
      const groupResponse = await VRCHAT_CLIENT.getGroup({ path: { groupId } });
      const group = groupResponse.data as unknown as VRChatGroupData;

      if (group.ownerId === profileData.vrchat_id || isAdmin) {
        validInvite = invite;
        groupData = group;
        break;
      }
    }

    if (!validInvite || !groupData) {
      await replyError(interaction, phrases["error.invalid_invitation"], WARNING_IMAGE, Colors.Orange);
      return;
    }

    linkGroupState.set<LinkGroupState>(userId, {
      inviteId: validInvite.id,
      groupId: groupData.id,
      groupName: groupData.name,
      serverId: guild.id,
    });

    const logChannelId = await D1Class.getDiscordSetting(
      userRequestData,
      guild.id,
      DISCORD_SERVER_SETTINGS.LOG_CHANNEL,
    );
    if (!guild.channels.cache.has(logChannelId)) {
      await replyError(interaction, phrases["error.log_channel_not_found"], WARNING_IMAGE, Colors.Orange);
      return;
    }

    const container = new ContainerBuilder()
      .setAccentColor(Colors.Blue)
      .addSectionComponents(
        new SectionBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `# ${phrases["terms.title"]}\n${phrases["terms.description"]}`,
            ),
          )
          .setThumbnailAccessory(
            new ThumbnailBuilder({ media: { url: `attachment://${WARNING_IMAGE.name}` } }),
          ),
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${phrases["terms.point1"]}\n` +
            `${phrases["terms.point2"].replace("{log_channel}", `<#${logChannelId}>`)}\n` +
            `${phrases["terms.point3"]}\n${phrases["terms.point4"]}`,
        ),
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          phrases["terms.point5"].replace("{groupName}", groupData.name),
        ),
      )
      .addMediaGalleryComponents(
        new MediaGalleryBuilder().addItems({ media: { url: groupData.iconUrl ?? "" } }),
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
      )
      .addActionRowComponents(
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          acceptButton(phrases),
          rejectButton(phrases),
        ),
      );

    await interaction.editReply({
      components: [container],
      files: [attachment(WARNING_IMAGE)],
      flags: MessageFlags.IsComponentsV2,
    });
  } catch (error) {
    printMessage("Error processing group invitation:", String(error));
    await replyError(interaction, phrases["error.generic"], ERROR_IMAGE);
  }
}

async function onAcceptTerms(interaction: ButtonInteraction, phrases: Phrases): Promise<void> {
  await interaction.deferUpdate();

  const userId = interaction.user.id;
  const state = linkGroupState.get<LinkGroupState>(userId);
  if (!state || !interaction.guild) {
    await replyError(interaction, phrases["error.generic"], ERROR_IMAGE);
    return;
  }

  const guild = interaction.guild;
  const userRequestData = { discord_id: userId, discord_name: interaction.user.username };

  const logChannelId = await D1Class.getDiscordSetting(
    userRequestData,
    guild.id,
    DISCORD_SERVER_SETTINGS.LOG_CHANNEL,
  );
  const logChannel = guild.channels.cache.get(logChannelId);
  if (!logChannel?.isTextBased()) {
    await replyError(interaction, phrases["error.no_log_channel_while_accepting_terms"], ERROR_IMAGE);
    return;
  }

  try {
    await VRCHAT_CLIENT.joinGroup({ path: { groupId: state.groupId } });
    const response = await D1Class.addVRChatGroup(
      userRequestData,
      state.groupId,
      state.serverId,
      state.groupName,
    );
    linkGroupState.del(userId);

    const container = new ContainerBuilder().setAccentColor(Colors.Green).addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `# ${phrases["success.title"]}\n` +
              phrases["success.description"].replace("{groupName}", state.groupName),
          ),
        )
        .setThumbnailAccessory(
          new ThumbnailBuilder({ media: { url: `attachment://${SUCCESS_IMAGE.name}` } }),
        ),
    );

    await interaction.editReply({
      components: [container],
      files: [attachment(SUCCESS_IMAGE)],
      flags: MessageFlags.IsComponentsV2,
    });

    printMessage(
      `Joined group ${state.groupName} by ${interaction.user.username} (${interaction.user.id})`,
    );

    const embed = new EmbedBuilder()
      .setTitle(phrases["log.action.title"].replace("{groupName}", state.groupName))
      .setDescription(
        phrases["log.action.actionid"]
          .replace("{action_id}", String(response.data.log_id))
          .replace("{vrchat_group_id}", state.groupId),
      )
      .setColor(Colors.Blurple)
      .setTimestamp()
      .setFooter({
        text: phrases["log.action.by"].replace("{user}", interaction.user.username),
        iconURL: interaction.user.displayAvatarURL(),
      });

    await (logChannel as TextBasedChannel & { send: (o: unknown) => Promise<unknown> }).send({
      embeds: [embed],
    });
  } catch (error) {
    printMessage("Error accepting group invitation:", String(error));
    await replyError(interaction, phrases["error.generic"], ERROR_IMAGE);
  }
}

async function onRejectTerms(interaction: ButtonInteraction, phrases: Phrases): Promise<void> {
  await interaction.deferUpdate();
  linkGroupState.del(interaction.user.id);

  const container = new ContainerBuilder()
    .setAccentColor(Colors.Red)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(phrases.cancelled));

  await interaction.editReply({ components: [container], files: [], flags: MessageFlags.IsComponentsV2 });
}

// =========================================================================================================
// Main
// =========================================================================================================

const data = new SlashCommandBuilder()
  .setName("linkgroup")
  .setDescription("Link a VRChat group with this Discord server.")
  .setDescriptionLocalizations({
    [Locale.SpanishLATAM]: "Vincula un grupo de VRChat con este servidor de Discord.",
    [Locale.SpanishES]: "Vincula un grupo de VRChat con este server de Discord, tronco.",
  })
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const phrases = localize(interaction.locale);

  if (!interaction.guild) {
    await replyError(interaction, phrases["error.generic"], ERROR_IMAGE);
    return;
  }

  const guild = interaction.guild;
  const userId = interaction.user.id;
  const userRequestData = { discord_id: userId, discord_name: interaction.user.username };

  try {
    let profileData;
    try {
      profileData = await D1Class.getProfile(userRequestData, userId, false);
    } catch {
      await replyError(interaction, phrases["error.not_linked"], ERROR_IMAGE);
      return;
    }
    if (!profileData?.vrchat_id) {
      await replyError(interaction, phrases["error.not_linked"], ERROR_IMAGE);
      return;
    }

    const settings = await D1Class.getAllDiscordSettings(userRequestData, guild.id);
    const logChannelId = settings[DISCORD_SERVER_SETTINGS.LOG_CHANNEL];
    if (!logChannelId || !guild.channels.cache.has(logChannelId)) {
      await replyError(interaction, phrases["error.no_log_channel"], WARNING_IMAGE, Colors.Orange);
      return;
    }

    const description = phrases["initial.description"].replace(
      "{VRCHAT_APPLICATION_NAME}",
      env.VRCHAT_APPLICATION_NAME,
    );

    const invitedButton = new ButtonBuilder()
      .setCustomId(customId(BUTTON.INVITED))
      .setLabel(phrases["initial.button"])
      .setStyle(ButtonStyle.Primary)
      .setEmoji("✅");

    const container = new ContainerBuilder()
      .setAccentColor(Colors.Blue)
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${phrases["initial.title"]}`),
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
      )
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(description))
      .addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
      )
      .addActionRowComponents(
        new ActionRowBuilder<ButtonBuilder>().addComponents(invitedButton),
      );

    await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  } catch (error) {
    printMessage("Error in linkgroup command:", String(error));
    await replyError(interaction, phrases["error.generic"], ERROR_IMAGE);
  }
}

async function handleButton(interaction: ButtonInteraction): Promise<void> {
  const phrases = localize(interaction.locale);
  const component = interaction.customId.slice(`${PREFIX}_`.length);

  switch (component) {
    case BUTTON.INVITED:
      await onInvited(interaction, phrases);
      break;
    case BUTTON.ACCEPT:
      await onAcceptTerms(interaction, phrases);
      break;
    case BUTTON.REJECT:
      await onRejectTerms(interaction, phrases);
      break;
    default:
      break;
  }
}

export const command: Command = { data, execute, handleButton };

// =========================================================================================================
// How It Works Command
// =========================================================================================================
// Paginated guide explaining the bot's features across 7 pages, navigated with first/prev/next/last
// buttons. Each page renders a Components V2 container with a thumbnail and navigation row.

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
  SectionBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  SlashCommandBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
} from "discord.js";
import type { ButtonInteraction, ChatInputCommandInteraction } from "discord.js";

import type { Command } from "./types.js";
import { createLocalizer } from "../lib/i18n.js";

// =========================================================================================================
// Constants
// =========================================================================================================

const TOTAL_PAGES = 7;
const FIRST_PAGE = 1;

// Custom id prefix so the interaction router dispatches button presses to this command.
const BUTTON_PREFIX = "howitworks";
// A page-navigation custom id is `howitworks_page_<n>`.
const PAGE_BUTTON = `${BUTTON_PREFIX}_page`;
// Disabled placeholder buttons need unique non-routing ids.
const NOOP_PREFIX = `${BUTTON_PREFIX}_noop`;

const PAGE_IMAGES = [
  "img/avatar.jpg",
  "img/page2.jpg",
  "img/page3.jpg",
  "img/page4.jpg",
  "img/page5.jpg",
  "img/page6.jpg",
  "img/page7.jpg",
];

const localize = createLocalizer({
  [Locale.EnglishUS]: {
    "button.start": "Start",
    "button.prev": "Previous Page",
    "button.next": "Next Page",
    "button.end": "End",
    "page1.title": "How it Works - Introduction",
    "page1.description":
      "Welcome to EnlaceVRC! This bot allows you to link your VRChat account with Discord.\n\n## Global Verification\nOne of the most important features is that **verification is global**. This means that if you verify your account on one server, you don't need to do it again on others! You can simply join any server using this bot and synchronize your roles immediately.",
    "page2.title": "How it Works - Verification",
    "page2.description":
      "To verify your account, use the `/verification` command. You will need to provide your VRChat profile URL.\n\nThe bot will give you a code that you must place in your VRChat bio. Once done, press the verify button and you're set!",
    "page3.title": "How it Works - Synchronization",
    "page3.description":
      "Once verified, you can use the `/sync` command in any server to update your roles and nickname based on your VRChat profile.\n\nThis is useful if you join a new server or if your VRChat details have changed.",
    "page4.title": "How it Works - Profile",
    "page4.description":
      "You can use the `/profile` command to view your VRChat profile.\n\nIf you have a 16Personalities code in your bio, a button will appear to view more details.\n\nFor 18+ verified users, the staff member who verified them will be shown for transparency.",
    "page5.title": "How it Works - Settings",
    "page5.description":
      "Server administrators can use the `/settings` command to configure the bot.\n\nYou can set up:\n- The role for verified users.\n- The role for 18+ verified users.\n- Whether to automatically update nicknames.",
    "page6.title": "FAQ - Can I verify users as 18+?",
    "page6.description":
      "**No, you cannot.**\n\nTo prevent malicious actions and ensure safety, 18+ verification can only be performed by **Authorized Staff**.\n\nThis measure ensures that sensitive permissions are only handled by trusted individuals.",
    "page7.title": "How to become Authorized Staff?",
    "page7.description":
      "If you want to be able to verify 18+ users, you need to become **Authorized Staff**.\n\n**Requirements:**\n- **Activity**: The community must be active.\n- **Community Size**: You need a significant number of members.\n- **Reputation**: The community must be free of drama or situations that have negatively affected its image.\n\nContact the bot support for more information.",
  },
  [Locale.SpanishLATAM]: {
    "button.start": "Inicio",
    "button.prev": "Página anterior",
    "button.next": "Siguiente Página",
    "button.end": "Final",
    "page1.title": "Cómo funciona - Introducción",
    "page1.description":
      "¡Bienvenido a EnlaceVRC! Este bot te permite vincular tu cuenta de VRChat con Discord.\n\n## Verificación Global\nUna de las características más importantes es que **la verificación es global**. ¡Esto significa que si verificas tu cuenta en un servidor, no necesitas hacerlo de nuevo en otros! Simplemente puedes entrar a cualquier servidor que use este bot y sincronizar tus roles de inmediato.",
    "page2.title": "Cómo funciona - Verificación",
    "page2.description":
      "Para verificar tu cuenta, usa el comando `/verification`. Necesitarás proporcionar la URL de tu perfil de VRChat.\n\nEl bot te dará un código que debes poner en tu biografía de VRChat. Una vez hecho, presiona el botón de verificar y ¡listo!",
    "page3.title": "Cómo funciona - Sincronización",
    "page3.description":
      "Una vez verificado, puedes usar el comando `/sync` en cualquier servidor para actualizar tus roles y apodo basándose en tu perfil de VRChat.\n\nEsto es útil si te unes a un nuevo servidor o si tus detalles de VRChat han cambiado.",
    "page4.title": "Cómo funciona - Perfil",
    "page4.description":
      "Puedes usar el comando `/profile` para ver tu perfil de VRChat.\n\nSi tienes un código de 16Personalities en tu biografía, aparecerá un botón para ver más detalles.\n\nPara usuarios verificados +18, se mostrará qué miembro del staff realizó la verificación para mayor transparencia.",
    "page5.title": "Cómo funciona - Configuración",
    "page5.description":
      "Los administradores del servidor pueden usar el comando `/settings` para configurar el bot.\n\nPuedes configurar:\n- El rol para usuarios verificados.\n- El rol para usuarios verificados +18.\n- Si se deben actualizar automáticamente los apodos.",
    "page6.title": "FAQ - ¿Puedo verificar +18 a los usuarios?",
    "page6.description":
      "**No, no puedes.**\n\nPara evitar acciones malintencionadas y garantizar la seguridad, la verificación +18 solo se puede realizar por **Staff Autorizado**.\n\nEsta medida asegura que los permisos sensibles solo sean manejados por personas de confianza.",
    "page7.title": "¿Cómo ser Staff Autorizado?",
    "page7.description":
      "Si quieres poder verificar usuarios +18, necesitas convertirte en **Staff Autorizado**.\n\n**Requisitos:**\n- **Actividad**: La comunidad debe ser activa.\n- **Tamaño de la comunidad**: Necesitas un número significativo de miembros.\n- **Reputación**: La comunidad debe estar libre de dramas o situaciones que hayan afectado su imagen negativamente.\n\nContacta al soporte del bot para más información.",
  },
  [Locale.SpanishES]: {
    "button.start": "Al principio, tío",
    "button.prev": "Pa atrás",
    "button.next": "Siguiente",
    "button.end": "Al final",
    "page1.title": "¿De qué va la vaina? - Intro",
    "page1.description":
      "¡Eeeh, qué pasa, máquina! Este bot es la caña para juntar tu cuenta del VRChat con el Discord, ¿sabes?\n\n## Verificación Global, flipas\nLo más guapo es que **la verificación es global, chaval**. O sea, que si te verificas en un lao, ¡ya te vale pa to los sitios! Te metes en otro server con el bot, sincronizas y a vivir la vida, colega.",
    "page2.title": "¿De qué va la vaina? - Verificación",
    "page2.description":
      "Pa verificarte, métele al comando `/verification`. Tienes que pasarle la URL de tu perfil de VRChat, no te líes.\n\nEl bot te suelta un código to guapo, lo pegas en tu bio de VRChat, le das al botón y ¡pum! Apañao.",
    "page3.title": "¿De qué va la vaina? - Sincronización",
    "page3.description":
      "Cuando ya estés verificado, usa `/sync` donde te dé la gana pa ponerte tus roles y tu nick de VRChat al día.\n\nTe viene de perlas si entras en un server nuevo o si te has cambiao el nombre en VRChat, tío.",
    "page4.title": "¿De qué va la vaina? - Perfil",
    "page4.description":
      "Usa el comando `/profile` para bichear tu perfil de VRChat.\n\nSi tienes puesto lo del 16Personalities en la bio, te saldrá un botón para cotillear más.\n\nSi estás verificado +18, saldrá quién te verificó para que todo sea legal y transparente, ¿sabes?",
    "page5.title": "¿De qué va la vaina? - Configuración",
    "page5.description":
      "Los jefazos del server pueden usar `/settings` para dejar el bot niquelao.\n\nSe puede poner:\n- El rol pa la peña verificada.\n- El rol pa los viejos (+18).\n- Si quieres que te cambie el nick solo, que mola mazo.",
    "page6.title": "FAQ - ¿Puedo verificar +18 a la basca?",
    "page6.description":
      "**¡Que no, tío, que no puedes!**\n\nPa que no haya movidas raras ni gente con malas ideas, lo de verificar +18 solo lo hace el **Staff Autorizado**.\n\nAsí nos aseguramos de que estas cosas serias solo las haga gente de fiar, ¿me entiendes?",
    "page7.title": "¿Cómo me hago Staff Autorizado?",
    "page7.description":
      "Si quieres verificar a la peña +18, tienes que ser **Staff Autorizado**, chaval.\n\n**Lo que hace falta:**\n- **Actividad**: Que la comunidad tenga vidilla, que no esté muerta.\n- **Gente**: Que seáis un buen puñao, no cuatro gatos.\n- **Buen rollo**: Que no hayáis tenido movidas chungas ni dramas que os hayan dejao mal.\n\nHabla con el soporte si quieres saber más, crack.",
  },
});

// =========================================================================================================
// Types
// =========================================================================================================

type Phrases = ReturnType<typeof localize>;

// =========================================================================================================
// Helpers
// =========================================================================================================

/** Builds the navigation row for a given page, disabling edges and wiring page custom ids. */
function buildNavigation(currentPage: number, phrases: Phrases): ActionRowBuilder<ButtonBuilder> {
  const atStart = currentPage === FIRST_PAGE;
  const atEnd = currentPage === TOTAL_PAGES;

  const firstButton = new ButtonBuilder()
    .setCustomId(`${PAGE_BUTTON}_${FIRST_PAGE}`)
    .setLabel(phrases["button.start"])
    .setStyle(ButtonStyle.Primary)
    .setDisabled(atStart);

  const prevButton = new ButtonBuilder()
    .setCustomId(atStart ? `${NOOP_PREFIX}_prev` : `${PAGE_BUTTON}_${currentPage - 1}`)
    .setLabel(phrases["button.prev"])
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(atStart);

  const indicator = new ButtonBuilder()
    .setCustomId(`${NOOP_PREFIX}_indicator`)
    .setLabel(String(currentPage))
    .setStyle(ButtonStyle.Success)
    .setDisabled(true);

  const nextButton = new ButtonBuilder()
    .setCustomId(atEnd ? `${NOOP_PREFIX}_next` : `${PAGE_BUTTON}_${currentPage + 1}`)
    .setLabel(phrases["button.next"])
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(atEnd);

  const lastButton = new ButtonBuilder()
    .setCustomId(`${PAGE_BUTTON}_${TOTAL_PAGES}`)
    .setLabel(phrases["button.end"])
    .setStyle(ButtonStyle.Primary)
    .setDisabled(atEnd);

  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    firstButton,
    prevButton,
    indicator,
    nextButton,
    lastButton,
  );
}

/** Builds the Components V2 container for a page plus the thumbnail attachment it references. */
function renderPage(
  page: number,
  phrases: Phrases,
): { container: ContainerBuilder; file: AttachmentBuilder } {
  const imagePath = PAGE_IMAGES[page - 1] ?? PAGE_IMAGES[0]!;
  const fileName = imagePath.split("/").pop() ?? "page.jpg";
  const file = new AttachmentBuilder(imagePath, { name: fileName });

  const title = phrases[`page${page}.title` as keyof Phrases];
  const description = phrases[`page${page}.description` as keyof Phrases];

  const container = new ContainerBuilder()
    .setAccentColor(Colors.Blue)
    .addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${title}\n\n${description}`))
        .setThumbnailAccessory(new ThumbnailBuilder().setURL(`attachment://${fileName}`)),
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
    )
    .addActionRowComponents(buildNavigation(page, phrases));

  return { container, file };
}

// =========================================================================================================
// Main
// =========================================================================================================

const data = new SlashCommandBuilder()
  .setName("howitworks")
  .setDescription("Explain how the bot works.")
  .setDescriptionLocalizations({
    [Locale.SpanishLATAM]: "Explica cómo funciona el bot.",
    [Locale.SpanishES]: "Te explico cómo va esto del bot, paso a paso.",
  });

async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const phrases = localize(interaction.locale);
  const { container, file } = renderPage(FIRST_PAGE, phrases);

  await interaction.editReply({
    flags: MessageFlags.IsComponentsV2,
    components: [container],
    files: [file],
  });
}

async function handleButton(interaction: ButtonInteraction): Promise<void> {
  // Ignore disabled placeholder buttons that share the command prefix.
  if (interaction.customId.startsWith(NOOP_PREFIX)) {
    return;
  }

  const pageStr = interaction.customId.slice(`${PAGE_BUTTON}_`.length);
  const page = Number.parseInt(pageStr, 10);
  if (Number.isNaN(page)) {
    return;
  }

  const phrases = localize(interaction.locale);
  const { container, file } = renderPage(page, phrases);

  await interaction.update({
    flags: MessageFlags.IsComponentsV2,
    components: [container],
    files: [file],
  });
}

export const command: Command = { data, execute, handleButton };

// =========================================================================================================
// World Info Command
// =========================================================================================================
// Displays information about a VRChat world given its ID or URL: author, capacity, occupancy, favorites,
// visits, platform compatibility, tags, timestamps and quick-launch buttons.

// =========================================================================================================
// Imports
// =========================================================================================================

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Colors,
  EmbedBuilder,
  Locale,
  SlashCommandBuilder,
} from "discord.js";
import type { ChatInputCommandInteraction } from "discord.js";

import type { Command } from "./types.js";
import { createLocalizer } from "../lib/i18n.js";
import { printMessage } from "../lib/logger.js";
import { VRCHAT_CLIENT } from "../services/vrchat.js";

// =========================================================================================================
// Constants
// =========================================================================================================

const WORLD_ID_REGEX = /^wrld_[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const WORLD_PATH_REGEX = /world\/(wrld_[a-f0-9-]+)/;
const MAX_TAGS = 10;
const HTTP_NOT_FOUND = 404;

const localize = createLocalizer({
  [Locale.EnglishUS]: {
    "error.invalid_world":
      "Invalid world ID or URL. Please provide a valid VRChat world ID (wrld_...) or URL.",
    "error.not_found": "World not found. Please check the ID or URL and try again.",
    "error.api_error":
      "An error occurred while fetching world information. Please try again later.",
    "embed.author": "Author",
    "embed.capacity": "Capacity",
    "embed.occupants": "Currently Online",
    "embed.favorites": "Favorites",
    "embed.visits": "Visits",
    "embed.created": "Created",
    "embed.updated": "Last Updated",
    "embed.tags": "Tags",
    "button.open": "Open in VRChat",
    "button.view_author": "View Author",
    "platform.pc": "💻 PC",
    "platform.both": "💻📱 PC & Quest Compatible",
  },
  [Locale.SpanishLATAM]: {
    "error.invalid_world":
      "ID o URL de mundo inválido. Por favor proporciona un ID de mundo válido de VRChat (wrld_...) o URL.",
    "error.not_found": "Mundo no encontrado. Por favor verifica el ID o URL e intenta de nuevo.",
    "error.api_error":
      "Ocurrió un error al obtener la información del mundo. Por favor intenta más tarde.",
    "embed.author": "Autor",
    "embed.capacity": "Capacidad",
    "embed.occupants": "Conectados Ahora",
    "embed.favorites": "Favoritos",
    "embed.visits": "Visitas",
    "embed.created": "Creado",
    "embed.updated": "Última Actualización",
    "embed.tags": "Etiquetas",
    "button.open": "Abrir en VRChat",
    "button.view_author": "Ver Autor",
    "platform.pc": "💻 PC",
    "platform.both": "💻📱 Compatible con PC y Quest",
  },
  [Locale.SpanishES]: {
    "error.invalid_world":
      "Ese ID o URL de mundo no vale, colega. Ponme uno bueno de VRChat (wrld_...) o un enlace.",
    "error.not_found": "No he encontrado ese mundo, tronco. Revisa el ID o la URL otra vez.",
    "error.api_error": "Uy, que ha petado algo al buscar el mundo. Prueba luego, ¿vale?",
    "embed.author": "Autor",
    "embed.capacity": "Capacidad",
    "embed.occupants": "Gente Conectada",
    "embed.favorites": "Favoritos",
    "embed.visits": "Visitas",
    "embed.created": "Creado",
    "embed.updated": "Última Vez Actualizado",
    "embed.tags": "Etiquetas",
    "button.open": "Abrir en VRChat",
    "button.view_author": "Ver Autor",
    "platform.pc": "💻 PC",
    "platform.both": "💻📱 PC y Quest Compatible",
  },
});

// =========================================================================================================
// Types
// =========================================================================================================

/** Subset of the VRChat world object this command reads. */
interface VRChatWorld {
  name: string;
  description?: string;
  thumbnailImageUrl?: string;
  imageUrl?: string;
  authorName: string;
  authorId: string;
  capacity?: number;
  occupants?: number;
  favorites?: number;
  visits?: number;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}

/** Shape of the error thrown by the VRChat client on a failed request. */
interface VRChatApiError {
  response?: { status?: number };
}

// =========================================================================================================
// Helpers
// =========================================================================================================

/** Extracts a clean world ID from a raw ID or a VRChat URL, or null when not extractable. */
function extractWorldId(input: string): string | null {
  if (input.startsWith("http://") || input.startsWith("https://")) {
    try {
      const url = new URL(input);
      const pathMatch = url.pathname.match(WORLD_PATH_REGEX);
      return pathMatch?.[1] ?? url.searchParams.get("worldId");
    } catch {
      return null;
    }
  }

  if (input.startsWith("wrld_")) {
    return input.split(":")[0] ?? null;
  }

  return null;
}

function toUnixSeconds(date: string): number {
  return Math.floor(new Date(date).getTime() / 1000);
}

// =========================================================================================================
// Main
// =========================================================================================================

const data = new SlashCommandBuilder()
  .setName("worldinfo")
  .setDescription("Display information about a VRChat world.")
  .setDescriptionLocalizations({
    [Locale.SpanishLATAM]: "Muestra información sobre un mundo de VRChat.",
    [Locale.SpanishES]: "Muestra toda la info de un mundo de VRChat, tío.",
  })
  .addStringOption((option) =>
    option.setName("world").setDescription("World ID or URL").setRequired(true),
  );

async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const phrases = localize(interaction.locale);
  const worldId = extractWorldId(interaction.options.getString("world", true));

  if (!worldId || !WORLD_ID_REGEX.test(worldId)) {
    await interaction.editReply({ content: phrases["error.invalid_world"] });
    return;
  }

  // NOTE: the original passed MessageFlags.Ephemeral to editReply on the error paths below, but
  // ephemerality is fixed at deferReply time and cannot change here, so it was a no-op and is dropped.

  try {
    const worldResponse = await VRCHAT_CLIENT.getWorld({ path: { worldId } });
    const world = worldResponse.data as unknown as VRChatWorld;

    const embed = new EmbedBuilder()
      .setTitle(world.name)
      .setDescription(world.description ?? "")
      .setColor(Colors.Blue)
      .setThumbnail(world.thumbnailImageUrl ?? world.imageUrl ?? null)
      .addFields(
        {
          name: phrases["embed.author"],
          value: `[${world.authorName}](https://vrchat.com/home/user/${world.authorId})`,
          inline: true,
        },
        { name: phrases["embed.capacity"], value: world.capacity?.toString() ?? "N/A", inline: true },
        { name: phrases["embed.occupants"], value: world.occupants?.toString() ?? "0", inline: true },
        { name: phrases["embed.favorites"], value: world.favorites?.toString() ?? "0", inline: true },
        { name: phrases["embed.visits"], value: world.visits?.toString() ?? "0", inline: true },
      );

    const platformText = world.tags?.includes("android")
      ? phrases["platform.both"]
      : phrases["platform.pc"];
    embed.addFields({ name: "🎮 Platform", value: platformText, inline: false });

    if (world.tags && world.tags.length > 0) {
      const relevantTags = world.tags
        .filter((tag) => !tag.startsWith("author_tag") && tag !== "android")
        .slice(0, MAX_TAGS);

      if (relevantTags.length > 0) {
        embed.addFields({
          name: phrases["embed.tags"],
          value: relevantTags.map((tag) => `\`${tag}\``).join(", "),
          inline: false,
        });
      }
    }

    if (world.created_at) {
      embed.addFields({
        name: phrases["embed.created"],
        value: `<t:${toUnixSeconds(world.created_at)}:D>`,
        inline: true,
      });
    }
    if (world.updated_at) {
      embed.addFields({
        name: phrases["embed.updated"],
        value: `<t:${toUnixSeconds(world.updated_at)}:R>`,
        inline: true,
      });
    }

    if (world.imageUrl) {
      embed.setImage(world.imageUrl);
    }

    const openButton = new ButtonBuilder()
      .setLabel(phrases["button.open"])
      .setStyle(ButtonStyle.Link)
      .setURL(`https://vrchat.com/home/launch?worldId=${worldId}`);

    const authorButton = new ButtonBuilder()
      .setLabel(phrases["button.view_author"])
      .setStyle(ButtonStyle.Link)
      .setURL(`https://vrchat.com/home/user/${world.authorId}`);

    await interaction.editReply({
      embeds: [embed],
      components: [new ActionRowBuilder<ButtonBuilder>().addComponents(openButton, authorButton)],
    });
  } catch (error) {
    printMessage("Error fetching world info:", String(error));

    const status = (error as VRChatApiError).response?.status;
    const content = status === HTTP_NOT_FOUND ? phrases["error.not_found"] : phrases["error.api_error"];

    await interaction.editReply({ content });
  }
}

export const command: Command = { data, execute };

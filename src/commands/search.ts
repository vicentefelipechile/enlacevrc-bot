// =========================================================================================================
// Search Command
// =========================================================================================================
// Searches VRChat worlds, avatars and users with paginated results. Pagination is handled by a
// per-message component collector scoped to the invoking user (idiomatic discord.js), so no global
// button routing is needed.

// =========================================================================================================
// Imports
// =========================================================================================================

import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
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
import type { ButtonInteraction, ChatInputCommandInteraction, Message } from "discord.js";
import NodeCache from "node-cache";

import type { Command } from "./types.js";
import { createLocalizer } from "../lib/i18n.js";
import { printMessage } from "../lib/logger.js";
import { VRCHAT_CLIENT } from "../services/vrchat.js";

// =========================================================================================================
// Constants
// =========================================================================================================

const SUBCOMMAND = { WORLD: "world", AVATAR: "avatar", USER: "user" } as const;

const AVATAR_ENDPOINT = "https://api.avtrdb.com/v2/avatar/search";
const IMAGE_PROXY_URL = "https://proxyimges.worldbalancer.com/proxy/image";

const RESULTS_PER_PAGE = 4;
const AVATAR_CACHE_TTL_SECONDS = 15 * 60;
const COLLECTOR_TIMEOUT_MS = 5 * 60 * 1000;
const FIRST_PAGE = 1;

const PREV_ID = "previous";
const NEXT_ID = "next";
const CURRENT_ID = "current";

const avatarDataCache = new NodeCache({ stdTTL: AVATAR_CACHE_TTL_SECONDS });
const avatarBrokenCache = new Map<string, boolean>();

const localize = createLocalizer({
  [Locale.EnglishUS]: {
    "error.no_results": 'No results found for "{query}".',
    "embed.title.world": "🌍 World Search Results",
    "embed.title.avatar": "👤 Avatar Search Results",
    "embed.title.user": "🔍 User Search Results",
    "embed.author": "Author",
    "embed.capacity": "Capacity",
    "embed.favorites": "Favorites",
    "button.previous": "Previous",
    "button.next": "Next",
    "avatars.embed.avatar": "Avatar **{name}**\nUploaded by **{author}**\n### [View avatar]({url})",
    "users.embed.rank.visitor": "Visitor",
    "users.embed.rank.basic": "Basic",
    "users.embed.rank.known": "Known",
    "users.embed.rank.trusted": "Trusted",
    "users.embed.content":
      "**{name}** • **{rank}**\n### [View profile](https://vrchat.com/home/user/{id})",
  },
  [Locale.SpanishLATAM]: {
    "error.no_results": 'No se encontraron resultados para "{query}".',
    "embed.title.world": "🌍 Resultados de Búsqueda de Mundos",
    "embed.title.avatar": "👤 Resultados de Búsqueda de Avatares",
    "embed.title.user": "🔍 Resultados de Búsqueda de Usuarios",
    "embed.author": "Autor",
    "embed.capacity": "Capacidad",
    "embed.favorites": "Favoritos",
    "button.previous": "Anterior",
    "button.next": "Siguiente",
    "avatars.embed.avatar": "Avatar: **{name}**\nSubido por: **{author}**\n### [Ver avatar]({url})",
    "users.embed.rank.visitor": "Visitante",
    "users.embed.rank.basic": "Nuevo Usuario",
    "users.embed.rank.known": "Usuario",
    "users.embed.rank.trusted": "Confiable",
    "users.embed.content":
      "**{name}** • **{rank}**\n### [Ver perfil](https://vrchat.com/home/user/{id})",
  },
  [Locale.SpanishES]: {
    "error.no_results": 'No he encontrado nada para "{query}", colega.',
    "embed.title.world": "🌍 Resultados de Mundos",
    "embed.title.avatar": "👤 Resultados de Avatares",
    "embed.title.user": "🔍 Resultados de Usuarios",
    "embed.author": "Autor",
    "embed.capacity": "Capacidad",
    "embed.favorites": "Favoritos",
    "button.previous": "Anterior",
    "button.next": "Siguiente",
    "avatars.embed.avatar": "Avatar **{name}**\nSubido por **{author}**\n### [Ver avatar]({url})",
    "users.embed.rank.visitor": "Visitante",
    "users.embed.rank.basic": "Nuevo Usuario",
    "users.embed.rank.known": "Usuario",
    "users.embed.rank.trusted": "Confiable",
    "users.embed.content":
      "**{name}** • **{rank}**\n### [Ver perfil](https://vrchat.com/home/user/{id})",
  },
});

// =========================================================================================================
// Types
// =========================================================================================================

type Phrases = ReturnType<typeof localize>;

interface VRChatWorld {
  id: string;
  authorName?: string;
  capacity?: number;
  favorites?: number;
  thumbnailImageUrl?: string;
  imageUrl?: string;
}

interface VRChatSearchUser {
  id: string;
  displayName: string;
  tags?: string[];
  profilePicOverride?: string;
  currentAvatarImageUrl?: string;
}

interface AvatarData {
  id: string;
  name: string;
  author: string;
  image: AttachmentBuilder;
}

// =========================================================================================================
// Helpers — Component Builders
// =========================================================================================================

/** Builds the prev/current/next pagination row shared by all result types. */
function paginationRow(
  currentPage: number,
  phrases: Phrases,
  nextDisabled: boolean,
): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel(phrases["button.previous"])
      .setStyle(ButtonStyle.Primary)
      .setCustomId(PREV_ID)
      .setDisabled(currentPage === FIRST_PAGE),
    new ButtonBuilder()
      .setLabel(String(currentPage))
      .setStyle(ButtonStyle.Secondary)
      .setCustomId(CURRENT_ID)
      .setDisabled(true),
    new ButtonBuilder()
      .setLabel(phrases["button.next"])
      .setStyle(ButtonStyle.Primary)
      .setCustomId(NEXT_ID)
      .setDisabled(nextDisabled),
  );
}

function buildWorldContainer(
  worlds: VRChatWorld[],
  phrases: Phrases,
  currentPage: number,
): ContainerBuilder {
  const container = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${phrases["embed.title.world"]}`))
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
    );

  for (const world of worlds) {
    const info: string[] = [];
    if (world.authorName) {
      info.push(`**${phrases["embed.author"]}:** ${world.authorName}`);
    }
    if (world.capacity !== undefined) {
      info.push(`**${phrases["embed.capacity"]}:** ${world.capacity}`);
    }
    if (world.favorites !== undefined) {
      info.push(`**${phrases["embed.favorites"]}:** ${world.favorites.toLocaleString()}`);
    }

    const content = `${info.join(" • ")}\n### [Ver mundo](https://vrchat.com/home/world/${world.id})`;
    container.addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(content))
        .setThumbnailAccessory(
          new ThumbnailBuilder({ media: { url: world.thumbnailImageUrl ?? world.imageUrl ?? "" } }),
        ),
    );
  }

  return container
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
    )
    .addActionRowComponents(paginationRow(currentPage, phrases, worlds.length === 0));
}

function buildAvatarContainer(
  avatars: AvatarData[],
  phrases: Phrases,
  currentPage: number,
): ContainerBuilder {
  const container = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${phrases["embed.title.avatar"]}`))
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
    );

  for (const avatar of avatars) {
    container.addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            phrases["avatars.embed.avatar"]
              .replace("{name}", avatar.name)
              .replace("{author}", avatar.author)
              .replace("{url}", `https://vrchat.com/home/avatar/${avatar.id}`),
          ),
        )
        .setThumbnailAccessory(
          new ThumbnailBuilder({ media: { url: `attachment://${avatar.id}.png` } }),
        ),
    );
  }

  return container
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
    )
    .addActionRowComponents(
      paginationRow(currentPage, phrases, avatars.length < RESULTS_PER_PAGE),
    );
}

function buildUserContainer(
  users: VRChatSearchUser[],
  phrases: Phrases,
  currentPage: number,
): ContainerBuilder {
  const container = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${phrases["embed.title.user"]}`))
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
    );

  for (const user of users) {
    container.addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            phrases["users.embed.content"]
              .replace("{name}", user.displayName)
              .replace("{rank}", trustRank(user, phrases))
              .replace("{id}", user.id),
          ),
        )
        .setThumbnailAccessory(
          new ThumbnailBuilder({
            media: { url: user.profilePicOverride ?? user.currentAvatarImageUrl ?? "" },
          }),
        ),
    );
  }

  return container
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
    )
    .addActionRowComponents(paginationRow(currentPage, phrases, users.length === 0));
}

/** Derives a colored trust-rank label for a user from their tags. */
function trustRank(user: VRChatSearchUser, phrases: Phrases): string {
  const tags = user.tags ?? [];
  if (tags.includes("system_trust_trusted")) {
    return `💜 ${phrases["users.embed.rank.trusted"]}`;
  }
  if (tags.includes("system_trust_known")) {
    return `💚 ${phrases["users.embed.rank.known"]}`;
  }
  if (tags.includes("system_trust_basic")) {
    return `💙 ${phrases["users.embed.rank.basic"]}`;
  }
  return `⚪ ${phrases["users.embed.rank.visitor"]}`;
}

// =========================================================================================================
// Helpers — VRChat Data Retrieval
// =========================================================================================================

async function getWorlds(query: string, page: number): Promise<VRChatWorld[]> {
  const response = await VRCHAT_CLIENT.searchWorlds({
    query: { search: query, n: RESULTS_PER_PAGE, offset: (page - 1) * RESULTS_PER_PAGE },
  });
  return (response.data as unknown as VRChatWorld[] | undefined) ?? [];
}

async function getUsers(query: string, page: number): Promise<VRChatSearchUser[]> {
  const response = await VRCHAT_CLIENT.searchUsers({
    query: { search: query, n: RESULTS_PER_PAGE, offset: (page - 1) * RESULTS_PER_PAGE },
  });
  return (response.data as unknown as VRChatSearchUser[] | undefined) ?? [];
}

/** Fetches a page of avatars from avtrdb, resolving each via the VRChat API and caching results. */
async function getAvatars(page: number, query: string): Promise<AvatarData[]> {
  const params = new URLSearchParams({
    query,
    page_size: String(RESULTS_PER_PAGE + 5),
    page: String(page - 1),
  });

  let avatarIds: string[] = [];
  try {
    const response = await fetch(`${AVATAR_ENDPOINT}?${params.toString()}`);
    const responseData = (await response.json()) as { avatars: { vrc_id: string }[] };
    avatarIds = responseData.avatars.map((a) => a.vrc_id);
  } catch (error) {
    printMessage("Error fetching avatars:", String(error));
    return [];
  }

  const avatars: AvatarData[] = [];
  for (const avatarId of avatarIds) {
    if (avatars.length >= RESULTS_PER_PAGE) {
      break;
    }
    if (avatarBrokenCache.get(avatarId)) {
      continue;
    }

    const cached = avatarDataCache.get<AvatarData>(avatarId);
    if (cached) {
      avatars.push(cached);
      continue;
    }

    const resolved = await resolveAvatar(avatarId);
    if (resolved) {
      avatars.push(resolved);
    }
  }

  return avatars;
}

/** Resolves a single avatar by ID, fetching its proxied thumbnail and caching the result. */
async function resolveAvatar(avatarId: string): Promise<AvatarData | null> {
  try {
    const avatarResponse = await VRCHAT_CLIENT.getAvatar({ path: { avatarId } });
    const avatarRecord = avatarResponse as { error?: unknown; data?: AvatarApiData };
    if (avatarRecord.error || !avatarRecord.data) {
      avatarBrokenCache.set(avatarId, true);
      return null;
    }

    const proxyUrl = new URL(IMAGE_PROXY_URL);
    proxyUrl.searchParams.set("url", avatarRecord.data.thumbnailImageUrl);

    const imageResponse = await fetch(proxyUrl.toString());
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    const avatarData: AvatarData = {
      id: avatarId,
      name: avatarRecord.data.name,
      author: avatarRecord.data.authorName,
      image: new AttachmentBuilder(imageBuffer, { name: `${avatarId}.png` }),
    };

    printMessage(`Cached avatar "${avatarData.name}" by ${avatarData.author}`);
    avatarDataCache.set(avatarId, avatarData);
    return avatarData;
  } catch {
    avatarBrokenCache.set(avatarId, true);
    return null;
  }
}

interface AvatarApiData {
  name: string;
  authorName: string;
  thumbnailImageUrl: string;
}

// =========================================================================================================
// Main
// =========================================================================================================

const data = new SlashCommandBuilder()
  .setName("search")
  .setDescription("Search for VRChat content.")
  .setDescriptionLocalizations({
    [Locale.SpanishLATAM]: "Buscar contenido de VRChat.",
    [Locale.SpanishES]: "Busca cosas de VRChat, tío.",
  })
  .addSubcommand((sub) =>
    sub
      .setName(SUBCOMMAND.WORLD)
      .setDescription("Search for VRChat worlds")
      .addStringOption((opt) => opt.setName("query").setDescription("Search query").setRequired(true)),
  )
  .addSubcommand((sub) =>
    sub
      .setName(SUBCOMMAND.AVATAR)
      .setDescription("Search for VRChat avatars")
      .addStringOption((opt) => opt.setName("query").setDescription("Search query").setRequired(true)),
  )
  .addSubcommand((sub) =>
    sub
      .setName(SUBCOMMAND.USER)
      .setDescription("Search for VRChat users")
      .addStringOption((opt) => opt.setName("query").setDescription("Search query").setRequired(true)),
  );

/** Strips mass-mention syntax from a query so search results cannot ping. */
function sanitizeQuery(query: string): string {
  return query
    .replace(/@everyone/g, "everyone")
    .replace(/@here/g, "here")
    .replace(/<@!?\d+>/g, "")
    .trim();
}

async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const phrases = localize(interaction.locale);
  const subcommand = interaction.options.getSubcommand();
  const query = interaction.options.getString("query", true);
  const sanitizedQuery = sanitizeQuery(query);

  if (sanitizedQuery.length === 0) {
    await interaction.editReply({ content: phrases["error.no_results"].replace("{query}", query) });
    return;
  }

  const noResults = phrases["error.no_results"].replace("{query}", sanitizedQuery);

  if (subcommand === SUBCOMMAND.WORLD) {
    await runWorldSearch(interaction, query, phrases, noResults);
  } else if (subcommand === SUBCOMMAND.AVATAR) {
    await runAvatarSearch(interaction, query, phrases, noResults);
  } else {
    await runUserSearch(interaction, query, phrases, noResults);
  }
}

/** Common collector wiring: tracks a page counter and re-renders on prev/next presses. */
function paginate(
  interaction: ChatInputCommandInteraction,
  message: Message,
  render: (page: number, press: ButtonInteraction) => Promise<void>,
): void {
  let page = FIRST_PAGE;
  const collector = message.createMessageComponentCollector({
    componentType: ComponentType.Button,
    filter: (i) => i.user.id === interaction.user.id,
    time: COLLECTOR_TIMEOUT_MS,
  });

  collector.on("collect", (press) => {
    void (async () => {
      if (!press.deferred) {
        await press.deferUpdate();
      }
      if (press.customId === PREV_ID) {
        page -= 1;
      } else if (press.customId === NEXT_ID) {
        page += 1;
      }
      await render(page, press);
    })();
  });
}

async function runWorldSearch(
  interaction: ChatInputCommandInteraction,
  query: string,
  phrases: Phrases,
  noResults: string,
): Promise<void> {
  const worlds = await getWorlds(query, FIRST_PAGE);
  if (worlds.length === 0) {
    await interaction.editReply({ content: noResults });
    return;
  }

  const message = await interaction.editReply({
    components: [buildWorldContainer(worlds, phrases, FIRST_PAGE)],
    flags: MessageFlags.IsComponentsV2,
  });

  paginate(interaction, message, async (page, press) => {
    const next = await getWorlds(query, page);
    await press.editReply({
      components: [buildWorldContainer(next, phrases, page)],
      flags: MessageFlags.IsComponentsV2,
    });
  });
}

async function runUserSearch(
  interaction: ChatInputCommandInteraction,
  query: string,
  phrases: Phrases,
  noResults: string,
): Promise<void> {
  const users = await getUsers(query, FIRST_PAGE);
  if (users.length === 0) {
    await interaction.editReply({ content: noResults });
    return;
  }

  const message = await interaction.editReply({
    components: [buildUserContainer(users, phrases, FIRST_PAGE)],
    flags: MessageFlags.IsComponentsV2,
  });

  paginate(interaction, message, async (page, press) => {
    const next = await getUsers(query, page);
    await press.editReply({
      components: [buildUserContainer(next, phrases, page)],
      flags: MessageFlags.IsComponentsV2,
    });
  });
}

async function runAvatarSearch(
  interaction: ChatInputCommandInteraction,
  query: string,
  phrases: Phrases,
  noResults: string,
): Promise<void> {
  const avatars = await getAvatars(FIRST_PAGE, query);
  if (avatars.length === 0) {
    await interaction.editReply({ content: noResults });
    return;
  }

  const message = await interaction.editReply({
    components: [buildAvatarContainer(avatars, phrases, FIRST_PAGE)],
    flags: MessageFlags.IsComponentsV2,
    files: avatars.map((a) => a.image),
  });

  paginate(interaction, message, async (page, press) => {
    const next = await getAvatars(page, query);
    await press.editReply({
      components: [buildAvatarContainer(next, phrases, page)],
      flags: MessageFlags.IsComponentsV2,
      files: next.map((a) => a.image),
    });
  });
}

export const command: Command = { data, execute };

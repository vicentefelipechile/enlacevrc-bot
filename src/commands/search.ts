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
  ButtonBuilder,
  ButtonStyle,
  Colors,
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

import type { Command } from "./types.js";
import { env } from "../config/env.js";
import { createLocalizer } from "../lib/i18n.js";
import { printMessage } from "../lib/logger.js";
import { VRCHAT_CLIENT } from "../services/vrchat.js";
import { textContainer } from "../ui/container.js";

// =========================================================================================================
// Constants
// =========================================================================================================

const SUBCOMMAND = { WORLD: "world", AVATAR: "avatar", USER: "user" } as const;

const AVATAR_ENDPOINT = "https://api.avtrdb.com/v2/avatar/search";

// avtrdb rejects requests whose User-Agent lacks contact info (see avtrdb.com/faq). It expects the
// `tool_name/version (contact)` shape, so slug the configured app name and pair it with a version and
// the contact email — the same contact details already used for the VRChat client.
const AVATAR_TOOL_VERSION = "1.0.0";
const AVATAR_TOOL_NAME = env.VRCHAT_APPLICATION_NAME.trim().replace(/\s+/g, "_").toLowerCase();
const AVATAR_USER_AGENT = `${AVATAR_TOOL_NAME}/${AVATAR_TOOL_VERSION} (${env.VRCHAT_EMAIL_CONTACT})`;

const RESULTS_PER_PAGE = 4;
const COLLECTOR_TIMEOUT_MS = 5 * 60 * 1000;
const FIRST_PAGE = 1;
const MAX_DESCRIPTION_LENGTH = 100;
const AVATAR_CACHE_TTL_MS = 5 * 60 * 1000;

const PREV_ID = "previous";
const NEXT_ID = "next";
const CURRENT_ID = "current";

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
    "avatars.header": "### [{name}]({url})\n-# by **{author}**",
    "avatars.platforms": "Platforms",
    "avatars.explicit": "🔞 Explicit content",
    "button.open_avatar": "Open in VRChat",
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
    "avatars.header": "### [{name}]({url})\n-# por **{author}**",
    "avatars.platforms": "Plataformas",
    "avatars.explicit": "🔞 Contenido explícito",
    "button.open_avatar": "Abrir en VRChat",
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
    "avatars.header": "### [{name}]({url})\n-# de **{author}**, colega",
    "avatars.platforms": "Plataformas",
    "avatars.explicit": "🔞 Contenido subidito de tono",
    "button.open_avatar": "Abrir en VRChat",
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

type Platform = "pc" | "android" | "ios";

/** A single avatar as returned by the avtrdb v2 search endpoint (only the fields we render). */
interface AvatarData {
  id: string;
  name: string;
  author: string;
  description: string;
  imageUrl: string;
  compatibility: Platform[];
  styles: string[];
  tags: string[];
  explicit: boolean;
}

/** Raw avtrdb v2 avatar object; see https://api.avtrdb.com/v2/avatar/search. */
interface AvtrDbAvatar {
  vrc_id: string;
  name: string;
  author: { name: string };
  description: string;
  image_url: string;
  compatibility: Platform[];
  explicit: boolean;
  styles: { primary: string | null; secondary: string | null };
  tags: { author_tags: string[]; content_tags: string[]; non_content_tags: string[] };
}

interface AvtrDbResponse {
  avatars: AvtrDbAvatar[];
  has_more: boolean;
}

/** A page of avatar results plus whether the API reports further pages exist. */
interface AvatarPage {
  avatars: AvatarData[];
  hasMore: boolean;
}

const PLATFORM_EMOJI: Record<Platform, string> = { pc: "💻 PC", android: "📱 Quest", ios: "🍏 iOS" };

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

/** Escapes markdown control characters so free-form avatar text can't break the layout. */
function escapeMarkdown(text: string): string {
  return text.replace(/([`*_~|\\])/g, "\\$1");
}

/** Prefixes every line with `> ` so Discord renders the text as one quoted block with a side bar. */
function quoteBlock(text: string): string {
  return text
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");
}

/**
 * Assembles the body for a single avatar, mirroring the profile embed's layout: a heading with the
 * linked name, the author on a small line, the description as a quoted block and a platforms line.
 * Each avatar gets its own text block so a real separator can divide entries.
 */
function avatarBody(avatar: AvatarData, phrases: Phrases): string {
  const lines: string[] = [
    phrases["avatars.header"]
      .replace("{name}", escapeMarkdown(avatar.name))
      .replace("{author}", escapeMarkdown(avatar.author))
      .replace("{url}", `https://vrchat.com/home/avatar/${avatar.id}`),
  ];

  const description = avatar.description.trim().replace(/\s+/g, " ");
  if (description) {
    const truncated =
      description.length > MAX_DESCRIPTION_LENGTH
        ? `${description.slice(0, MAX_DESCRIPTION_LENGTH).trimEnd()}…`
        : description;
    lines.push(quoteBlock(escapeMarkdown(truncated)));
  }

  const meta: string[] = [];
  if (avatar.compatibility.length > 0) {
    const platforms = avatar.compatibility.map((p) => PLATFORM_EMOJI[p]).join(" · ");
    meta.push(`**${phrases["avatars.platforms"]}** ・ ${platforms}`);
  }
  if (avatar.explicit) {
    meta.push(phrases["avatars.explicit"]);
  }
  if (meta.length > 0) {
    lines.push(meta.join("\n"));
  }

  return lines.join("\n");
}

function buildAvatarContainer(
  page: AvatarPage,
  phrases: Phrases,
  currentPage: number,
): ContainerBuilder {
  const smallDivider = () =>
    new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small);

  const container = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${phrases["embed.title.avatar"]}`))
    .addSeparatorComponents(smallDivider());

  // Each avatar is its own section with a small thumbnail, separated by a real divider so the entries
  // read as distinct cards (matching the profile embed) instead of one dense block of text.
  page.avatars.forEach((avatar, index) => {
    const section = new SectionBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(avatarBody(avatar, phrases)),
    );

    if (avatar.imageUrl) {
      section.setThumbnailAccessory(new ThumbnailBuilder({ media: { url: avatar.imageUrl } }));
    } else {
      section.setButtonAccessory(
        new ButtonBuilder()
          .setLabel(phrases["button.open_avatar"])
          .setStyle(ButtonStyle.Link)
          .setURL(`https://vrchat.com/home/avatar/${avatar.id}`),
      );
    }

    container.addSectionComponents(section);
    if (index < page.avatars.length - 1) {
      container.addSeparatorComponents(smallDivider());
    }
  });

  return container
    .addSeparatorComponents(smallDivider())
    .addActionRowComponents(paginationRow(currentPage, phrases, !page.hasMore));
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

/** Maps a raw avtrdb avatar to the trimmed shape the UI renders. */
function toAvatarData(raw: AvtrDbAvatar): AvatarData {
  const styles = [raw.styles.primary, raw.styles.secondary].filter(
    (style): style is string => Boolean(style),
  );

  return {
    id: raw.vrc_id,
    name: raw.name,
    author: raw.author.name,
    description: raw.description,
    imageUrl: raw.image_url,
    compatibility: raw.compatibility,
    styles,
    tags: raw.tags.author_tags,
    explicit: raw.explicit,
  };
}

/**
 * Fetches a single page of avatars from the avtrdb v2 search endpoint. That one response carries every
 * field the card renders (name, author, description, thumbnail, platforms), so no per-avatar VRChat
 * lookup or image proxying is needed. `hasMore` drives the next-page button.
 */
async function fetchAvatars(page: number, query: string): Promise<AvatarPage> {
  const params = new URLSearchParams({
    query,
    page_size: String(RESULTS_PER_PAGE),
    page: String(page - 1),
  });

  printMessage("Fetching avatars", `"${query}"`, `page ${page}`);

  const response = await fetch(`${AVATAR_ENDPOINT}?${params.toString()}`, {
    headers: { "User-Agent": AVATAR_USER_AGENT },
  });
  const data = (await response.json()) as AvtrDbResponse;
  return { avatars: data.avatars.map(toAvatarData), hasMore: data.has_more };
}

/**
 * Caches in-flight/resolved avatar pages by `query|page` so navigating back and forth is instant and
 * concurrent requests for the same page share one fetch. Promises are cached (not just results) to
 * dedupe requests still in flight; a failed page is evicted so it can be retried later. Entries expire
 * after {@link AVATAR_CACHE_TTL_MS} to bound memory and avoid serving stale results indefinitely.
 */
const avatarPageCache = new Map<string, { page: Promise<AvatarPage>; expires: number }>();

function cachedAvatars(page: number, query: string): Promise<AvatarPage> {
  const key = `${query}|${page}`;
  const now = Date.now();

  const cached = avatarPageCache.get(key);
  if (cached && cached.expires > now) {
    return cached.page;
  }

  const promise = fetchAvatars(page, query).catch((error: unknown) => {
    // Don't cache failures: drop the entry so the next attempt refetches instead of replaying the error.
    avatarPageCache.delete(key);
    printMessage("Error fetching avatars:", String(error));
    return { avatars: [], hasMore: false } satisfies AvatarPage;
  });

  avatarPageCache.set(key, { page: promise, expires: now + AVATAR_CACHE_TTL_MS });
  return promise;
}

/**
 * Returns the requested avatar page, warming the cache for the neighbouring pages in the background.
 * Users almost always page forward (and sometimes back), so prefetching the adjacent pages makes the
 * next/previous presses feel instant. The prefetch is fire-and-forget; only the requested page is
 * awaited, and it's only triggered once the current page is known to have more results.
 */
async function getAvatars(page: number, query: string): Promise<AvatarPage> {
  const current = await cachedAvatars(page, query);

  if (current.hasMore) {
    void cachedAvatars(page + 1, query);
  }
  if (page > FIRST_PAGE) {
    void cachedAvatars(page - 1, query);
  }

  return current;
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
    await interaction.editReply({
      flags: MessageFlags.IsComponentsV2,
      components: [
        textContainer(phrases["error.no_results"].replace("{query}", query), Colors.Red),
      ],
    });
    return;
  }

  const noResults = phrases["error.no_results"].replace("{query}", sanitizedQuery);

  printMessage(
    "Search request",
    `${subcommand} "${sanitizedQuery}"`,
    `by ${interaction.user.username} (${interaction.user.id})`,
  );

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
    await interaction.editReply({
      flags: MessageFlags.IsComponentsV2,
      components: [textContainer(noResults, Colors.Red)],
    });
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
    await interaction.editReply({
      flags: MessageFlags.IsComponentsV2,
      components: [textContainer(noResults, Colors.Red)],
    });
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
  const firstPage = await getAvatars(FIRST_PAGE, query);
  if (firstPage.avatars.length === 0) {
    await interaction.editReply({
      flags: MessageFlags.IsComponentsV2,
      components: [textContainer(noResults, Colors.Red)],
    });
    return;
  }

  const message = await interaction.editReply({
    components: [buildAvatarContainer(firstPage, phrases, FIRST_PAGE)],
    flags: MessageFlags.IsComponentsV2,
  });

  paginate(interaction, message, async (page, press) => {
    const next = await getAvatars(page, query);
    await press.editReply({
      components: [buildAvatarContainer(next, phrases, page)],
      flags: MessageFlags.IsComponentsV2,
    });
  });
}

export const command: Command = { data, execute };

// =========================================================================================================
// Container UI Helpers
// =========================================================================================================
// Shared builders for Components V2 messages. The whole project renders responses exclusively inside
// containers (no classic embeds), so these helpers centralize the common shapes — a simple text notice,
// a title + body card with an optional thumbnail/image, action buttons and a footer line — to keep every
// command consistent and avoid repeating the same ContainerBuilder wiring everywhere.

// =========================================================================================================
// Imports
// =========================================================================================================

import {
  ActionRowBuilder,
  ButtonBuilder,
  Colors,
  ContainerBuilder,
  MediaGalleryBuilder,
  SectionBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  TextDisplayBuilder,
  ThumbnailBuilder,
} from "discord.js";

// =========================================================================================================
// Types
// =========================================================================================================

/**
 * Options for {@link buildContainer}. Mirrors the parts a classic embed used to provide. Optional
 * fields accept `undefined` explicitly so call sites can pass `value ?? undefined` under
 * `exactOptionalPropertyTypes`.
 */
export interface ContainerOptions {
  /** Accent bar color. Defaults to Blurple. */
  color?: number | undefined;
  /** Optional bold heading rendered as an H2 (`## title`). */
  title?: string | undefined;
  /** Main body text (markdown supported). */
  description?: string | undefined;
  /** Small thumbnail shown to the right of the title/description (uses a Section). */
  thumbnail?: string | undefined;
  /** Full-width image shown below the text (uses a media gallery). */
  image?: string | undefined;
  /** Footer line, rendered small (`-# footer`) under a separator. */
  footer?: string | undefined;
  /** Action button rows appended at the bottom. */
  buttons?: ButtonBuilder[] | undefined;
}

// =========================================================================================================
// Main
// =========================================================================================================

/** Joins a title (as an H2) and a description into a single text block, omitting empties. */
function headedText(title?: string, description?: string): string {
  const heading = title ? `## ${title}` : "";
  if (heading && description) {
    return `${heading}\n${description}`;
  }
  return heading || description || "";
}

/**
 * Builds a Components V2 container from embed-like options. When a thumbnail is given the title/body is
 * placed in a Section beside it; otherwise it's a plain text block. Image, footer and buttons are added
 * in that order below.
 */
export function buildContainer(options: ContainerOptions): ContainerBuilder {
  const container = new ContainerBuilder().setAccentColor(options.color ?? Colors.Blurple);
  const text = headedText(options.title, options.description);

  if (options.thumbnail) {
    container.addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(text || "​"))
        .setThumbnailAccessory(new ThumbnailBuilder().setURL(options.thumbnail)),
    );
  } else if (text) {
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(text));
  }

  if (options.image) {
    container.addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems({ media: { url: options.image } }),
    );
  }

  if (options.footer) {
    container
      .addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
      )
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${options.footer}`));
  }

  if (options.buttons && options.buttons.length > 0) {
    container.addActionRowComponents(
      new ActionRowBuilder<ButtonBuilder>().addComponents(...options.buttons),
    );
  }

  return container;
}

/** Shorthand for a single text-only notice container (success/error/info messages). */
export function textContainer(content: string, color: number = Colors.Blurple): ContainerBuilder {
  return buildContainer({ description: content, color });
}

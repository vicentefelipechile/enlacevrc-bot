// =========================================================================================================
// Verify Video
// =========================================================================================================
// The instructional verification clip shown both by the `verification`/`howtoverify` commands and by the
// welcome panel's Verify button. Centralized here so the attachment wiring and the Components V2 layout
// live in one place; callers pass the two localized strings (the body text and the "go to VRChat" label)
// so this module stays free of any single command's phrase table.

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
  MediaGalleryBuilder,
  TextDisplayBuilder,
} from "discord.js";

// =========================================================================================================
// Constants
// =========================================================================================================

const VRCHAT_URL = "https://vrchat.com/home";
const VERIFY_VIDEO_FILE = "img/verify.webm";
const VERIFY_VIDEO_NAME = "verify.webm";

// =========================================================================================================
// Main
// =========================================================================================================

/**
 * Builds the instructional video container plus its attachment from caller-provided localized strings.
 * When `extraButton` is provided (e.g. an "Enter username/URL" button that opens the verification modal),
 * it is placed before the "Go to VRChat" link so the user can act without typing in the channel.
 */
export function buildVerifyVideo(
  description: string,
  gotoLabel: string,
  extraButton?: ButtonBuilder,
): {
  container: ContainerBuilder;
  file: AttachmentBuilder;
} {
  const file = new AttachmentBuilder(VERIFY_VIDEO_FILE, { name: VERIFY_VIDEO_NAME });

  const gotoButton = new ButtonBuilder()
    .setStyle(ButtonStyle.Link)
    .setURL(VRCHAT_URL)
    .setEmoji("🔗")
    .setLabel(gotoLabel);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    ...(extraButton ? [extraButton] : []),
    gotoButton,
  );

  const container = new ContainerBuilder()
    .setAccentColor(Colors.Aqua)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(description))
    .addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems({ media: { url: `attachment://${VERIFY_VIDEO_NAME}` } }),
    )
    .addActionRowComponents(row);

  return { container, file };
}

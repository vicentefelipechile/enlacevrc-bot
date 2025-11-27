const { ContainerBuilder, TextDisplayBuilder, MediaGalleryBuilder, ActionRowBuilder, ButtonStyle, ButtonBuilder, SeparatorBuilder, SeparatorSpacingSize } = require('discord.js');
const GetRandomColor = require('../randomcolor');

const PERSONALITY_URL = 'https://www.16personalities.com/es/personalidad-';
const PERSONALITY_TYPES = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP',
];

function FormatP16(description) {
  let formattedDescription = description;
  for (const type of PERSONALITY_TYPES) {
    const regex = new RegExp(`\\b(${type}(?:-[A-Z])?)\\b`, 'gi');
    if (regex.test(description)) {
      const url = `${PERSONALITY_URL}${type.toLowerCase()}`;
      formattedDescription = formattedDescription.replace(regex, `[$1](${url})`);
    }
  }
  return formattedDescription;
};

function ExtractP16URL(description) {
  for (const type of PERSONALITY_TYPES) {
    const regex = new RegExp(`\\b(${type}(?:-[A-Z])?)\\b`, 'i');
    const match = description.match(regex);
    if (match) {
      return `${PERSONALITY_URL}${type.toLowerCase()}`;
    }
  }
  return null;
}

function FormatProfileEmbed(vrchatUser, profileData, locale, subText = null) {
  const sanitizedBio = vrchatUser.bio.replace(/([`*_~|\\-])/g, '\\$1');
  const formattedBio = FormatP16(sanitizedBio);

  const textContent = locale['embed.body']
    .replace('{profile_name}', vrchatUser.displayName)
    .replace('{profile_url}', `https://vrchat.com/home/user/${vrchatUser.id}`)
    .replace('{profile_bio}', formattedBio)
    .replace('{profile_status}', vrchatUser.status || locale['embed.status.nostatus'])
    .replace('{profile_wokestuff}', vrchatUser.pronouns || locale['embed.pronouns.nopronouns']);

  let footerContent = '';
  if (profileData.is_verified) {
    footerContent += locale['embed.verification_by'].replace('{discord_id}', profileData.verified_by);
    footerContent += '\n';
  }
  footerContent += `ID: ${vrchatUser.id} • ${new Date(vrchatUser.date_joined).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`;

  const buttonsContainer = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setLabel(locale['button.view_profile'])
        .setStyle(ButtonStyle.Link)
        .setEmoji('🔗')
        .setURL(`https://vrchat.com/home/user/${vrchatUser.id}`)
    );
  
  const P16 = ExtractP16URL(vrchatUser.bio);
  if (P16) {
    buttonsContainer.addComponents(
      new ButtonBuilder()
        .setLabel(locale['button.view_personality'])
        .setStyle(ButtonStyle.Link)
        .setEmoji('🧠')
        .setURL(P16)
    );
  }

  const newComponent = new ContainerBuilder()
    .setAccentColor(GetRandomColor())
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(textContent)
    )
    .addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems({ media: { url: vrchatUser.profilePicOverride || vrchatUser.currentAvatarImageUrl } })
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(footerContent)
    )
    .addActionRowComponents(buttonsContainer);

  return newComponent;
}

module.exports = {
  FormatP16,
  FormatProfileEmbed,
  ExtractP16URL,
};
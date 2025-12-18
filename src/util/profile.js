const { ContainerBuilder, TextDisplayBuilder, MediaGalleryBuilder, ActionRowBuilder, ButtonStyle, ButtonBuilder, SeparatorBuilder, SeparatorSpacingSize } = require('discord.js');
const GetRandomColor = require('../randomcolor');
const { formatUrlsWithEmojis } = require('./socialicons');

function FormatDate(date) {
  return `${new Date(date).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}`;
}

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

async function FormatProfileEmbed(vrchatUser, profileData, locale, subText = null) {
  const sanitizedBio = vrchatUser.bio.replace(/([`*_~|\\-])/g, '\\$1');
  const formattedBio = FormatP16(sanitizedBio);

  let formattedDisplayName = vrchatUser.displayName

  if (profileData.is_banned) {
    formattedDisplayName = `~~${formattedDisplayName}~~ ${locale['embed.banned']}`;
  }

  // Extract Trust Level and add emoji
  const trustLevelEmojis = {
    'Visitor': '🔘',
    'New User': '🔵',
    'User': '🟢',
    'Known User': '🟠',
    'Trusted User': '🟣'
  };
  const trustLevel = vrchatUser.tags?.find(tag => ['system_trust_basic', 'system_trust_known', 'system_trust_trusted', 'system_trust_veteran', 'system_trust_legend'].includes(tag));
  let trustLevelText = '';
  if (trustLevel) {
    const levelMap = {
      'system_trust_basic': 'New User',
      'system_trust_known': 'User',
      'system_trust_trusted': 'Known User',
      'system_trust_veteran': 'Trusted User',
      'system_trust_legend': 'Trusted User'
    };
    const levelName = levelMap[trustLevel] || 'Visitor';
    const emoji = trustLevelEmojis[levelName] || '⚪';
    trustLevelText = `\n**Trust Level**: ${emoji} ${levelName}`;
  }

  // Extract and format social links with emojis
  const bioWithLinks = vrchatUser.bio + '\n' + (vrchatUser.statusDescription || '');
  const { formatted_urls, has_unknown_links } = formatUrlsWithEmojis(bioWithLinks);
  let linksText = '';
  if (formatted_urls.length > 0) {
    linksText = '\n\n**Links**:\n' + formatted_urls.slice(0, 5).join('\n');
    if (has_unknown_links) {
      linksText += '\n\n⚠️ _Este perfil contiene enlaces externos. Nunca entres a enlaces de personas que no conozcas por seguridad._';
    }
  }

  // Extract VRChat badges if available
  let badgesText = '';
  if (vrchatUser.badges && vrchatUser.badges.length > 0) {
    const badgeEmojis = vrchatUser.badges.map(badge => {
      // Map badge IDs to emojis or names
      return badge.badgeName || badge.badgeDescription || '🏅';
    }).slice(0, 5);
    if (badgeEmojis.length > 0) {
      badgesText = `\n**Badges**: ${badgeEmojis.join(' ')}`;
    }
  }

  // Calculate days verified
  let daysVerifiedText = '';
  if (profileData.created_at) {
    const createdDate = new Date(profileData.created_at);
    const now = new Date();
    const diffTime = Math.abs(now - createdDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    daysVerifiedText = `\n**Days Verified**: ${diffDays}`;
  }

  // Account creation date
  let accountAgeText = '';
  if (vrchatUser.date_joined) {
    accountAgeText = `\n**Account Created**: <t:${Math.floor(new Date(vrchatUser.date_joined).getTime() / 1000)}:D>`;
  }

  const textContent = locale['embed.body']
    .replace('{profile_name}', formattedDisplayName)
    .replace('{profile_url}', `https://vrchat.com/home/user/${vrchatUser.id}`)
    .replace('{profile_bio}', formattedBio)
    .replace('{profile_status}', vrchatUser.status || locale['embed.status.nostatus'])
    .replace('{profile_wokestuff}', vrchatUser.pronouns || locale['embed.pronouns.nopronouns']);

  let footerContent = '';
  if (profileData.is_verified) {
    footerContent += locale['embed.verification_by'].replace('{discord_id}', profileData.verified_by);
    footerContent += '\n';
  }
  footerContent += `ID: ${vrchatUser.id} • ${FormatDate(vrchatUser.date_joined)}`;

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

  if (profileData.is_banned) {
    newComponent.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    )

    const bannedFooterContent = locale['embed.banned_by']
      .replace('{banned_by}', profileData.banned_by)
      .replace('{banned_reason}', profileData.banned_reason)
      .replace('{banned_at}', `${FormatDate(profileData.banned_at)}`);

    newComponent.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(bannedFooterContent)
    )

    newComponent.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    )
  }

  newComponent.addActionRowComponents(buttonsContainer);

  return newComponent;
}

module.exports = {
  FormatP16,
  FormatProfileEmbed,
  ExtractP16URL,
};
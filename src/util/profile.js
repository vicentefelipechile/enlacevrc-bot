const { EmbedBuilder } = require('discord.js');
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

function FormatProfileEmbed(vrchatUser, profileData, locale) {
  const sanitizedBio = vrchatUser.bio.replace(/([`*_~|\\-])/g, '\\$1');
  const formattedBio = FormatP16(sanitizedBio);

  const fields = [
    {
      name: locale['embed.status'],
      value: vrchatUser.statusDescription || locale['embed.status.nostatus'],
      inline: true
    },
    {
      name: locale['embed.pronouns'],
      value: vrchatUser.pronouns || locale['embed.pronouns.nopronouns'],
      inline: true
    },
  ];

  if (profileData.is_verified) {
    fields.push({
      name: locale['embed.verification_data'],
      value: locale['embed.verification_data.by'].replace('{discord_id}', profileData.verified_by),
      inline: false
    });
  }

  return new EmbedBuilder()
    .setColor(GetRandomColor())
    .setTitle(vrchatUser.displayName)
    .setURL(`https://vrchat.com/home/user/${vrchatUser.id}`)
    .setDescription(locale['embed.description'].replace('{bio}', formattedBio || 'No biography available'))
    .setImage(vrchatUser.profilePicOverride || vrchatUser.currentAvatarImageUrl)
    .addFields(...fields)
    .setFooter({ text: `ID: ${vrchatUser.id}` })
    .setTimestamp(new Date(vrchatUser.date_joined));
}

module.exports = {
  FormatP16,
  FormatProfileEmbed,
};
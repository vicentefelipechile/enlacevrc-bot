/**
 * @file        commands/instance.js
 * @author      vicentefelipechile
 * @license     MIT
 * @description Command to analyze VRChat instance invitation links
 */

const { ApplicationCommandOptionType, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, Colors, MessageFlags, Locale } = require('discord.js');
const { ModularCommand, RegisterCommand } = require('js-discord-modularcommand');
const { VRCHAT_CLIENT } = require('../vrchat.js');
const { parseVRChatInstance } = require('../util/instanceparser.js');

const instanceCommand = new ModularCommand('instance')
    .setDescription('Analyze a VRChat instance URL or ID.')
    .setCooldown(10);

instanceCommand.addOption({
    name: 'url',
    type: ApplicationCommandOptionType.String,
    description: 'VRChat instance URL or instance ID',
    required: true,
});

// =================================================================================================
// Localization
// =================================================================================================

instanceCommand.setLocalizationDescription({
    [Locale.EnglishUS]: 'Analyze a VRChat instance URL or ID.',
    [Locale.SpanishLATAM]: 'Analiza una URL o ID de instancia de VRChat.',
    [Locale.SpanishES]: 'analiza un enlace o ID de instancia de VRChat.',
});

instanceCommand.setLocalizationPhrases({
    [Locale.EnglishUS]: {
        'error.invalid': 'Invalid instance URL or ID. Please provide a valid VRChat instance link.',
        'error.no_world': 'Could not extract world ID from the instance.',
        'error.api_error': 'An error occurred while fetching instance information.',
        'embed.title': 'VRChat Instance Info',
        'embed.world': 'World',
        'embed.instance_type': 'Instance Type',
        'embed.region': 'Region',
        'embed.instance_id': 'Instance ID',
        'embed.instance_number': 'Instance Number',
        'embed.occupants': 'Current Occupants',
        'button.join': 'Join Instance',
        'button.copy_id': 'Copy Instance ID',
        'button.world_info': 'World Info',
    },
    [Locale.SpanishLATAM]: {
        'error.invalid': 'URL o ID de instancia inválido. Proporciona un enlace válido de instancia de VRChat.',
        'error.no_world': 'No se pudo extraer el ID del mundo de la instancia.',
        'error.api_error': 'Ocurrió un error al obtener información de la instancia.',
        'embed.title': 'Info de Instancia de VRChat',
        'embed.world': 'Mundo',
        'embed.instance_type': 'Tipo de Instancia',
        'embed.region': 'Región',
        'embed.instance_id': 'ID de Instancia',
        'embed.instance_number': 'Número de Instancia',
        'embed.occupants': 'Jugadores Actuales',
        'button.join': 'Unirse a Instancia',
        'button.copy_id': 'Copiar ID',
        'button.world_info': 'Info del Mundo',
    },
    [Locale.SpanishES]: {
        'error.invalid': 'Esa URL o ID de instancia no mola, tío. Dame un enlace bueno de VRChat.',
        'error.no_world': 'No he podido sacar el ID del mundo, colega.',
        'error.api_error': 'Uff, se ha roto algo al buscar la instancia.',
        'embed.title': 'Info de la Instancia de VRChat',
        'embed.world': 'Mundo',
        'embed.instance_type': 'Tipo de Instancia',
        'embed.region': 'Región',
        'embed.instance_id': 'ID de Instancia',
        'embed.instance_number': 'Número de Instancia',
        'embed.occupants': 'Gente Conectada',
        'button.join': 'Unirse',
        'button.copy_id': 'Copiar ID',
        'button.world_info': 'Info del Mundo',
    }
});

// =================================================================================================
// Command Execution
// =================================================================================================

instanceCommand.setExecute(async ({ interaction, locale, args }) => {
    await interaction.deferReply();

    const instanceInput = args['url'];

    // Parse instance
    const parsedInstance = parseVRChatInstance(instanceInput);

    if (!parsedInstance || !parsedInstance.instance_id) {
        return interaction.editReply({
            content: locale['error.invalid'],
            flags: MessageFlags.Ephemeral
        });
    }

    if (!parsedInstance.world_id) {
        return interaction.editReply({
            content: locale['error.no_world'],
            ephemeral: true
        });
    }

    try {
        // Fetch world information
        const worldResponse = await VRCHAT_CLIENT.getWorld({
            path: {
                worldId: parsedInstance.world_id
            }
        });

        const world = worldResponse.data;

        // Build embed
        const embed = new EmbedBuilder()
            .setTitle(locale['embed.title'])
            .setColor(Colors.Green)
            .setThumbnail(world.thumbnailImageUrl || world.imageUrl)
            .addFields(
                { name: locale['embed.world'], value: `**${world.name}**`, inline: false },
                { name: locale['embed.instance_type'], value: parsedInstance.instance_type, inline: true },
                { name: locale['embed.region'], value: parsedInstance.region, inline: true }
            );

        if (parsedInstance.instance_number) {
            embed.addFields({ name: locale['embed.instance_number'], value: `#${parsedInstance.instance_number}`, inline: true });
        }

        // Add occupants if available
        if (world.occupants !== undefined) {
            embed.addFields({ name: locale['embed.occupants'], value: `${world.occupants}/${world.capacity}`, inline: true });
        }

        embed.addFields({ name: locale['embed.instance_id'], value: `\`${parsedInstance.instance_id}\``, inline: false });

        // Create buttons
        const joinButton = new ButtonBuilder()
            .setLabel(locale['button.join'])
            .setStyle(ButtonStyle.Link)
            .setURL(`https://vrchat.com/home/launch?worldId=${parsedInstance.world_id}&instanceId=${parsedInstance.instance_id}`);

        const worldInfoButton = new ButtonBuilder()
            .setLabel(locale['button.world_info'])
            .setStyle(ButtonStyle.Link)
            .setURL(`https://vrchat.com/home/world/${parsedInstance.world_id}`);

        const row = new ActionRowBuilder().addComponents(joinButton, worldInfoButton);

        await interaction.editReply({
            embeds: [embed],
            components: [row]
        });

    } catch (error) {
        console.error('Error fetching instance info:', error);
        return interaction.editReply({
            content: locale['error.api_error'],
            flags: MessageFlags.Ephemeral
        });
    }
});

// =================================================================================================
// Exports
// =================================================================================================

module.exports = RegisterCommand([instanceCommand]);

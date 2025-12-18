/**
 * @file        commands/worldinfo.js
 * @author      vicentefelipechile
 * @license     MIT
 * @description Command to display information about a VRChat world
 */

const { ApplicationCommandOptionType, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, Colors, MessageFlags, Locale } = require('discord.js');
const { ModularCommand, RegisterCommand } = require('js-discord-modularcommand');
const { VRCHAT_CLIENT } = require('../vrchat.js');

const worldInfoCommand = new ModularCommand('worldinfo')
    .setDescription('Display information about a VRChat world.')
    .setCooldown(10);

worldInfoCommand.addOption({
    name: 'world',
    type: ApplicationCommandOptionType.String,
    description: 'World ID or URL',
    required: true,
});

// =================================================================================================
// Localization
// =================================================================================================

worldInfoCommand.setLocalizationDescription({
    [Locale.EnglishUS]: 'Display information about a VRChat world.',
    [Locale.SpanishLATAM]: 'Muestra información sobre un mundo de VRChat.',
    [Locale.SpanishES]: 'Muestra toda la info de un mundo de VRChat, tío.',
});

worldInfoCommand.setLocalizationPhrases({
    [Locale.EnglishUS]: {
        'error.invalid_world': 'Invalid world ID or URL. Please provide a valid VRChat world ID (wrld_...) or URL.',
        'error.not_found': 'World not found. Please check the ID or URL and try again.',
        'error.api_error': 'An error occurred while fetching world information. Please try again later.',
        'embed.title': 'VRChat World Info',
        'embed.author': 'Author',
        'embed.capacity': 'Capacity',
        'embed.occupants': 'Currently Online',
        'embed.favorites': 'Favorites',
        'embed.visits': 'Visits',
        'embed.created': 'Created',
        'embed.updated': 'Last Updated',
        'embed.tags': 'Tags',
        'button.open': 'Open in VRChat',
        'button.view_author': 'View Author',
        'platform.pc': '💻 PC',
        'platform.quest': '📱 Quest',
        'platform.both': '💻📱 PC & Quest Compatible',
    },
    [Locale.SpanishLATAM]: {
        'error.invalid_world': 'ID o URL de mundo inválido. Por favor proporciona un ID de mundo válido de VRChat (wrld_...) o URL.',
        'error.not_found': 'Mundo no encontrado. Por favor verifica el ID o URL e intenta de nuevo.',
        'error.api_error': 'Ocurrió un error al obtener la información del mundo. Por favor intenta más tarde.',
        'embed.title': 'Info del Mundo de VRChat',
        'embed.author': 'Autor',
        'embed.capacity': 'Capacidad',
        'embed.occupants': 'Conectados Ahora',
        'embed.favorites': 'Favoritos',
        'embed.visits': 'Visitas',
        'embed.created': 'Creado',
        'embed.updated': 'Última Actualización',
        'embed.tags': 'Etiquetas',
        'button.open': 'Abrir en VRChat',
        'button.view_author': 'Ver Autor',
        'platform.pc': '💻 PC',
        'platform.quest': '📱 Quest',
        'platform.both': '💻📱 Compatible con PC y Quest',
    },
    [Locale.SpanishES]: {
        'error.invalid_world': 'Ese ID o URL de mundo no vale, colega. Ponme uno bueno de VRChat (wrld_...) o un enlace.',
        'error.not_found': 'No he encontrado ese mundo, tronco. Revisa el ID o la URL otra vez.',
        'error.api_error': 'Uy, que ha petado algo al buscar el mundo. Prueba luego, ¿vale?',
        'embed.title': 'Info del Mundo de VRChat',
        'embed.author': 'Autor',
        'embed.capacity': 'Capacidad',
        'embed.occupants': 'Gente Conectada',
        'embed.favorites': 'Favoritos',
        'embed.visits': 'Visitas',
        'embed.created': 'Creado',
        'embed.updated': 'Última Vez Actualizado',
        'embed.tags': 'Etiquetas',
        'button.open': 'Abrir en VRChat',
        'button.view_author': 'Ver Autor',
        'platform.pc': '💻 PC',
        'platform.quest': '📱 Quest',
        'platform.both': '💻📱 PC y Quest Compatible',
    }
});

worldInfoCommand.setLocalizationOptions({
    [Locale.EnglishUS]: {
        'world': 'World ID or URL',
    },
    [Locale.SpanishLATAM]: {
        'world': 'ID o URL del mundo',
    },
    [Locale.SpanishES]: {
        'world': 'ID o enlace del mundo',
    }
});

// =================================================================================================
// Command Execution
// =================================================================================================

worldInfoCommand.setExecute(async ({ interaction, locale, args }) => {
    await interaction.deferReply();

    const worldInput = args['world'];

    // Extract world ID from input
    let worldId = null;

    // Check if it's a URL
    if (worldInput.startsWith('http://') || worldInput.startsWith('https://')) {
        try {
            const url = new URL(worldInput);
            // Extract from path like /home/world/wrld_xxx
            const pathMatch = url.pathname.match(/world\/(wrld_[a-f0-9-]+)/);
            if (pathMatch) {
                worldId = pathMatch[1];
            } else {
                // Try search params
                worldId = url.searchParams.get('worldId');
            }
        } catch (error) {
            // Invalid URL
        }
    } else if (worldInput.startsWith('wrld_')) {
        worldId = worldInput.split(':')[0]; // Remove instance ID if present
    }

    if (!worldId || !worldId.match(/^wrld_[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/)) {
        return interaction.editReply({
            content: locale['error.invalid_world'],
            flags: MessageFlags.Ephemeral
        });
    }

    // Fetch world information from VRChat API
    try {
        const worldResponse = await VRCHAT_CLIENT.getWorld({
            path: {
                worldId: worldId
            }
        });

        const world = worldResponse.data;

        // Build embed
        const embed = new EmbedBuilder()
            .setTitle(world.name)
            .setDescription(world.description || '')
            .setColor(Colors.Blue)
            .setThumbnail(world.thumbnailImageUrl || world.imageUrl)
            .addFields(
                { name: locale['embed.author'], value: `[${world.authorName}](https://vrchat.com/home/user/${world.authorId})`, inline: true },
                { name: locale['embed.capacity'], value: world.capacity?.toString() || 'N/A', inline: true },
                { name: locale['embed.occupants'], value: world.occupants?.toString() || '0', inline: true },
                { name: locale['embed.favorites'], value: world.favorites?.toString() || '0', inline: true },
                { name: locale['embed.visits'], value: world.visits?.toString() || '0', inline: true }
            );

        // Add platform info
        let platformText = locale['platform.pc'];
        if (world.tags && world.tags.includes('android')) {
            platformText = locale['platform.both'];
        }
        embed.addFields({ name: '🎮 Platform', value: platformText, inline: false });

        // Add tags if present
        if (world.tags && world.tags.length > 0) {
            const relevantTags = world.tags
                .filter(tag => !tag.startsWith('author_tag') && tag !== 'android')
                .slice(0, 10); // Limit to 10 tags

            if (relevantTags.length > 0) {
                embed.addFields({ name: locale['embed.tags'], value: relevantTags.map(tag => `\`${tag}\``).join(', '), inline: false });
            }
        }

        // Add timestamps
        if (world.created_at) {
            embed.addFields({ name: locale['embed.created'], value: `<t:${Math.floor(new Date(world.created_at).getTime() / 1000)}:D>`, inline: true });
        }
        if (world.updated_at) {
            embed.addFields({ name: locale['embed.updated'], value: `<t:${Math.floor(new Date(world.updated_at).getTime() / 1000)}:R>`, inline: true });
        }

        // Add image if available
        if (world.imageUrl) {
            embed.setImage(world.imageUrl);
        }

        // Create buttons
        const openButton = new ButtonBuilder()
            .setLabel(locale['button.open'])
            .setStyle(ButtonStyle.Link)
            .setURL(`https://vrchat.com/home/launch?worldId=${worldId}`);

        const authorButton = new ButtonBuilder()
            .setLabel(locale['button.view_author'])
            .setStyle(ButtonStyle.Link)
            .setURL(`https://vrchat.com/home/user/${world.authorId}`);

        const row = new ActionRowBuilder().addComponents(openButton, authorButton);

        await interaction.editReply({
            embeds: [embed],
            components: [row]
        });

    } catch (error) {
        console.error('Error fetching world info:', error);

        if (error.response && error.response.status === 404) {
            return interaction.editReply({
                content: locale['error.not_found'],
                flags: MessageFlags.Ephemeral
            });
        }

        return interaction.editReply({
            content: locale['error.api_error'],
            flags: MessageFlags.Ephemeral
        });
    }
});

// =================================================================================================
// Exports
// =================================================================================================

module.exports = RegisterCommand([worldInfoCommand]);

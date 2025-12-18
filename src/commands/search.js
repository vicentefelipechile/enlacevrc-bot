/**
 * @file        commands/search.js
 * @author      vicentefelipechile
 * @license     MIT
 * @description Command to search for VRChat worlds, avatars, and users
 */

// =================================================================================================
// Imports
// =================================================================================================

const { ApplicationCommandOptionType, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, Colors, ComponentType, MessageFlags, Locale, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, SectionBuilder, ThumbnailBuilder, AttachmentBuilder } = require('discord.js');
const { ModularCommand, RegisterCommand } = require('js-discord-modularcommand');
const { VRCHAT_CLIENT } = require('../vrchat.js');
const NodeCache = require('node-cache');
const PrintMessage = require('../print.js');

// =================================================================================================
// Variables
// =================================================================================================

const AVATAR_ENDPOINT = new URL('https://api.avtrdb.com/v2/avatar/search');
const AVATAR_DATA_CACHE = new NodeCache({ stdTTL: 15 * 60 });
const AVATAR_BROKEN_CACHE = new Map();
const AVATAR_PER_PAGE = 4;
const WORLDS_PER_PAGE = 4;
const USERS_PER_PAGE = 4;

const IMAGE_PROXY_URL = new URL('https://proxyimges.worldbalancer.com/proxy/image');

const searchCommand = new ModularCommand('search')
    .setDescription('Search for VRChat content.')
    .setCooldown(10);

const SUBCOMMANDS_NAME = {
    WORLD: 'world',
    AVATAR: 'avatar',
    USER: 'user'
}

const ARGS = {
    QUERY: 'query'
}

searchCommand.addSubCommand({
    name: SUBCOMMANDS_NAME.WORLD,
    description: 'Search for VRChat worlds',
    options: [
        {
            name: ARGS.QUERY,
            type: ApplicationCommandOptionType.String,
            description: 'Search query',
            required: true
        }
    ]
});

searchCommand.addSubCommand({
    name: SUBCOMMANDS_NAME.AVATAR,
    description: 'Search for VRChat avatars',
    options: [
        {
            name: ARGS.QUERY,
            type: ApplicationCommandOptionType.String,
            description: 'Search query',
            required: true
        }
    ]
});

searchCommand.addSubCommand({
    name: SUBCOMMANDS_NAME.USER,
    description: 'Search for VRChat users',
    options: [
        {
            name: ARGS.QUERY,
            type: ApplicationCommandOptionType.String,
            description: 'Search query',
            required: true
        }
    ]
});

// =================================================================================================
// Localization
// =================================================================================================

searchCommand.setLocalizationDescription({
    [Locale.EnglishUS]: 'Search for VRChat content.',
    [Locale.SpanishLATAM]: 'Buscar contenido de VRChat.',
    [Locale.SpanishES]: 'Busca cosas de VRChat, tío.',
});

searchCommand.setLocalizationPhrases({
    [Locale.EnglishUS]: {
        'error.no_results': 'No results found for "{query}".',
        'error.api_error': 'An error occurred while searching. Please try again later.',
        'embed.title.world': '🌍 World Search Results',
        'embed.title.avatar': '👤 Avatar Search Results',
        'embed.title.user': '🔍 User Search Results',
        'embed.author': 'Author',
        'embed.capacity': 'Capacity',
        'embed.favorites': 'Favorites',
        'embed.visits': 'Visits',
        'embed.page': 'Page {current} of {total}',
        'button.previous': 'Previous',
        'button.next': 'Next',
        'button.view': 'View',
        'avatars.embed.avatar': 'Avatar **{name}**\nUploaded by **{author}**\n### [View avatar]({url})',
        'avatars.embed.content': '**{name}** • **{author}**\n### [View avatar]({url})',
        'users.embed.rank.visitor': 'Visitor',
        'users.embed.rank.basic': 'Basic',
        'users.embed.rank.known': 'Known',
        'users.embed.rank.trusted': 'Trusted',
        'users.embed.content': '**{name}** • **{rank}**\n### [View profile](https://vrchat.com/home/user/{id})',
    },
    [Locale.SpanishLATAM]: {
        'error.no_results': 'No se encontraron resultados para "{query}".',
        'error.api_error': 'Ocurrió un error al buscar. Por favor intenta más tarde.',
        'embed.title.world': '🌍 Resultados de Búsqueda de Mundos',
        'embed.title.avatar': '👤 Resultados de Búsqueda de Avatares',
        'embed.title.user': '🔍 Resultados de Búsqueda de Usuarios',
        'embed.author': 'Autor',
        'embed.capacity': 'Capacidad',
        'embed.favorites': 'Favoritos',
        'embed.visits': 'Visitas',
        'embed.page': 'Página {current} de {total}',
        'button.previous': 'Anterior',
        'button.next': 'Siguiente',
        'button.view': 'Ver',
        'avatars.embed.title': 'Resultados de Búsqueda de Avatares para {name}',
        'avatars.embed.avatar': 'Avatar: **{name}**\nSubido por: **{author}**\n### [Ver avatar]({url})',
        'avatars.embed.content': '**{name}** • **{author}**\n### [Ver avatar]({url})',
        'users.embed.rank.visitor': 'Visitante',
        'users.embed.rank.basic': 'Nuevo Usuario',
        'users.embed.rank.known': 'Usuario',
        'users.embed.rank.trusted': 'Confiable',
        'users.embed.content': '**{name}** • **{rank}**\n### [Ver perfil](https://vrchat.com/home/user/{id})',
    },
    [Locale.SpanishES]: {
        'error.no_results': 'No he encontrado nada para "{query}", colega.',
        'error.api_error': 'Uy, que se ha roto la búsqueda. Prueba luego.',
        'embed.title.world': '🌍 Resultados de Mundos',
        'embed.title.avatar': '👤 Resultados de Avatares',
        'embed.title.user': '🔍 Resultados de Usuarios',
        'embed.author': 'Autor',
        'embed.capacity': 'Capacidad',
        'embed.favorites': 'Favoritos',
        'embed.page': 'Página {current} de {total}',
        'button.previous': 'Anterior',
        'button.next': 'Siguiente',
        'button.view': 'Ver',
        'avatars.embed.title': 'Avatares que he encontrao de {name}, tío',
        'avatars.embed.avatar': 'Avatar **{name}**\nSubido por **{author}**\n### [Ver avatar]({url})',
        'users.embed.rank.visitor': 'Visitante',
        'users.embed.rank.basic': 'Nuevo Usuario',
        'users.embed.rank.known': 'Usuario',
        'users.embed.rank.trusted': 'Confiable',
        'users.embed.content': '**{name}** • **{rank}**\n### [Ver perfil](https://vrchat.com/home/user/{id})',
    }
});

searchCommand.setLocalizationSubCommands({
    [Locale.EnglishUS]: {
        [`${SUBCOMMANDS_NAME.WORLD}`]: 'Search Worlds',
        [`${SUBCOMMANDS_NAME.WORLD}.description`]: 'Search for VRChat worlds',
        [`${SUBCOMMANDS_NAME.WORLD}.${ARGS.QUERY}`]: 'Search query',
        [`${SUBCOMMANDS_NAME.WORLD}.${ARGS.QUERY}.description`]: 'Search query',
        [`${SUBCOMMANDS_NAME.AVATAR}`]: 'Search Avatars',
        [`${SUBCOMMANDS_NAME.AVATAR}.description`]: 'Search for VRChat avatars',
        [`${SUBCOMMANDS_NAME.AVATAR}.${ARGS.QUERY}`]: 'Search query',
        [`${SUBCOMMANDS_NAME.AVATAR}.${ARGS.QUERY}.description`]: 'Search query',
        [`${SUBCOMMANDS_NAME.USER}`]: 'Search Users',
        [`${SUBCOMMANDS_NAME.USER}.description`]: 'Search for VRChat users',
        [`${SUBCOMMANDS_NAME.USER}.${ARGS.QUERY}`]: 'Search query',
        [`${SUBCOMMANDS_NAME.USER}.${ARGS.QUERY}.description`]: 'Search query',
    },
    [Locale.SpanishLATAM]: {
        [`${SUBCOMMANDS_NAME.WORLD}`]: 'Buscar Mundos',
        [`${SUBCOMMANDS_NAME.WORLD}.description`]: 'Buscar mundos de VRChat',
        [`${SUBCOMMANDS_NAME.WORLD}.${ARGS.QUERY}`]: 'Búsqueda',
        [`${SUBCOMMANDS_NAME.WORLD}.${ARGS.QUERY}.description`]: 'Búsqueda',
        [`${SUBCOMMANDS_NAME.AVATAR}`]: 'Buscar Avatares',
        [`${SUBCOMMANDS_NAME.AVATAR}.description`]: 'Buscar avatares de VRChat',
        [`${SUBCOMMANDS_NAME.AVATAR}.${ARGS.QUERY}`]: 'Búsqueda',
        [`${SUBCOMMANDS_NAME.AVATAR}.${ARGS.QUERY}.description`]: 'Búsqueda',
        [`${SUBCOMMANDS_NAME.USER}`]: 'Buscar Usuarios',
        [`${SUBCOMMANDS_NAME.USER}.description`]: 'Buscar usuarios de VRChat',
        [`${SUBCOMMANDS_NAME.USER}.${ARGS.QUERY}`]: 'Búsqueda',
        [`${SUBCOMMANDS_NAME.USER}.${ARGS.QUERY}.description`]: 'Búsqueda',
    },
    [Locale.SpanishES]: {
        [`${SUBCOMMANDS_NAME.WORLD}`]: 'Buscar Mundos',
        [`${SUBCOMMANDS_NAME.WORLD}.description`]: 'Busca mundos de VRChat',
        [`${SUBCOMMANDS_NAME.WORLD}.${ARGS.QUERY}`]: 'Qué buscar',
        [`${SUBCOMMANDS_NAME.AVATAR}`]: 'Buscar Avatares',
        [`${SUBCOMMANDS_NAME.AVATAR}.description`]: 'Busca avatares de VRChat',
        [`${SUBCOMMANDS_NAME.AVATAR}.${ARGS.QUERY}`]: 'Qué buscar',
        [`${SUBCOMMANDS_NAME.AVATAR}.${ARGS.QUERY}.description`]: 'Qué buscar',
        [`${SUBCOMMANDS_NAME.USER}`]: 'Buscar Usuarios',
        [`${SUBCOMMANDS_NAME.USER}.description`]: 'Busca usuarios de VRChat',
        [`${SUBCOMMANDS_NAME.USER}.${ARGS.QUERY}`]: 'Qué buscar',
        [`${SUBCOMMANDS_NAME.USER}.${ARGS.QUERY}.description`]: 'Qué buscar',
    }
});

// =================================================================================================
// Helper Functions
// =================================================================================================

function createWorldEmbed(worlds, locale, currentPage) {
    const component = new ContainerBuilder()
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`## ${locale['embed.title.world']}`)
        )
        .addSeparatorComponents(
            new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
        )

    worlds.forEach((world) => {
        // Build world information
        const worldInfo = [];

        if (world.authorName) {
            worldInfo.push(`**${locale['embed.author']}:** ${world.authorName}`);
        }

        if (world.capacity !== undefined) {
            worldInfo.push(`**${locale['embed.capacity']}:** ${world.capacity}`);
        }

        if (world.favorites !== undefined) {
            worldInfo.push(`**${locale['embed.favorites']}:** ${world.favorites.toLocaleString()}`);
        }

        const contentText = worldInfo.join(' • ') + '\n### [Ver mundo](https://vrchat.com/home/world/${world.id})';

        component.addSectionComponents(
            new SectionBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        contentText
                    )
                )
                .setThumbnailAccessory(
                    new ThumbnailBuilder({
                        media: { url: world.thumbnailImageUrl || world.imageUrl }
                    })
                )
        )
    })

    component
        .addSeparatorComponents(
            new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
        )
        .addActionRowComponents(
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel(locale['button.previous'])
                        .setStyle(ButtonStyle.Primary)
                        .setCustomId('previous')
                        .setDisabled(currentPage === 1),
                    new ButtonBuilder()
                        .setLabel(currentPage.toString())
                        .setStyle(ButtonStyle.Secondary)
                        .setCustomId('current')
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setLabel(locale['button.next'])
                        .setStyle(ButtonStyle.Primary)
                        .setCustomId('next')
                        .setDisabled(worlds.length === 0)
                )
        )

    return component;
}

function createAvatarEmbed(avatars, locale, currentPage) {
    const component = new ContainerBuilder()
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`## ${locale['embed.title.avatar']}`)
        )
        .addSeparatorComponents(
            new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
        )

    avatars.forEach((avatar) => {
        component.addSectionComponents(
            new SectionBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        locale['avatars.embed.avatar']
                            .replace('{name}', avatar.name)
                            .replace('{author}', avatar.author)
                            .replace('{url}', `https://vrchat.com/home/avatar/${avatar.id}`)
                    )
                )
                .setThumbnailAccessory(
                    new ThumbnailBuilder({ media: { url: "attachment://" + avatar.image.name } })
                )
        )
    })

    component
        .addSeparatorComponents(
            new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
        )
        .addActionRowComponents(
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel(locale['button.previous'])
                        .setStyle(ButtonStyle.Primary)
                        .setCustomId('previous')
                        .setDisabled(currentPage === 1),
                    new ButtonBuilder()
                        .setLabel(currentPage.toString())
                        .setStyle(ButtonStyle.Secondary)
                        .setCustomId('current')
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setLabel(locale['button.next'])
                        .setStyle(ButtonStyle.Primary)
                        .setCustomId('next')
                        .setDisabled(avatars.length < AVATAR_PER_PAGE)
                )
        )

    return component;
}

function createUserEmbed(users, locale, currentPage) {
    const component = new ContainerBuilder()
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`## ${locale['embed.title.user']}`)
        )
        .addSeparatorComponents(
            new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
        )

    users.forEach((user) => {
        // Determine trust rank from tags
        let trustRank = '⚪ ' + locale['users.embed.rank.visitor'];
        if (user.tags) {
            if (user.tags.includes('system_trust_trusted')) {
                trustRank = '💜 ' + locale['users.embed.rank.trusted'];
            } else if (user.tags.includes('system_trust_known')) {
                trustRank = '💚 ' + locale['users.embed.rank.known'];
            } else if (user.tags.includes('system_trust_basic')) {
                trustRank = '💙 ' + locale['users.embed.rank.basic'];
            } else {
                trustRank = '⚪ ' + locale['users.embed.rank.visitor'];
            }
        }

        component.addSectionComponents(
            new SectionBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        locale['users.embed.content']
                            .replace('{name}', user.displayName)
                            .replace('{rank}', trustRank)
                            .replace('{id}', user.id)
                    )
                )
                .setThumbnailAccessory(
                    new ThumbnailBuilder({
                        media: { url: user.profilePicOverride || user.currentAvatarImageUrl }
                    })
                )
        )
    })

    component
        .addSeparatorComponents(
            new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
        )
        .addActionRowComponents(
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel(locale['button.previous'])
                        .setStyle(ButtonStyle.Primary)
                        .setCustomId('previous')
                        .setDisabled(currentPage === 1),
                    new ButtonBuilder()
                        .setLabel(currentPage.toString())
                        .setStyle(ButtonStyle.Secondary)
                        .setCustomId('current')
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setLabel(locale['button.next'])
                        .setStyle(ButtonStyle.Primary)
                        .setCustomId('next')
                        .setDisabled(users.length === 0)
                )
        )

    return component;
}

// =================================================================================================
// VRChat Data Retriever
// =================================================================================================

async function getAvatars(page, query, amount = AVATAR_PER_PAGE) {
    const params = new URLSearchParams({
        query: query,
        page_size: amount + 5,
        page: page - 1
    });

    AVATAR_ENDPOINT.search = params;

    let avatarsData = [];
    let avatars = [];

    try {
        const response = await fetch(AVATAR_ENDPOINT.toString());
        const responseData = await response.json();

        responseData.avatars.forEach((avatar) => {
            avatarsData.push(avatar.vrc_id);
        });
    } catch (error) {
        console.error('Error al obtener avatares:', error);
    }

    if (avatarsData && avatarsData.length > 0) {
        let found = 0;
        let currentIndex = 0;

        for await (const avatar of avatarsData) {
            if (found >= amount) {
                break;
            }

            currentIndex++;

            if (AVATAR_BROKEN_CACHE.get(avatar)) {
                continue;
            }

            if (AVATAR_DATA_CACHE.get(avatar)) {
                avatars.push(AVATAR_DATA_CACHE.get(avatar));
                found++;
                continue;
            }

            let avatarResponse = await VRCHAT_CLIENT.getAvatar({
                path: {
                    avatarId: avatar
                }
            });

            if (avatarResponse.error) {
                AVATAR_BROKEN_CACHE.set(avatar, true);
                continue;
            }

            const avatarData = {
                id: avatar,
                name: avatarResponse.data.name,
                author: avatarResponse.data.authorName,
            };

            IMAGE_PROXY_URL.searchParams.set('url', avatarResponse.data.thumbnailImageUrl);

            const imageResponse = await fetch(IMAGE_PROXY_URL.toString());
            const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

            const attachment = new AttachmentBuilder(imageBuffer, { name: `${avatar}.png` });
            avatarData.image = attachment;

            PrintMessage('Cached avatar "' + avatarResponse.data.name + '" by ' + avatarResponse.data.authorName);

            AVATAR_DATA_CACHE.set(avatar, avatarData);
            avatars.push(avatarData);
            found++;
        }

        // Precargar avatares restantes en segundo plano (sin esperar)
        const remainingAvatars = avatarsData.slice(currentIndex);
        if (remainingAvatars.length > 0) {
            // Proceso en background - no bloqueante
            (async () => {
                const preloadPromises = remainingAvatars.map(async (avatar) => {
                    // Saltar si ya está en caché o marcado como roto
                    if (AVATAR_BROKEN_CACHE.get(avatar) || AVATAR_DATA_CACHE.get(avatar)) {
                        return;
                    }

                    try {
                        const avatarResponse = await VRCHAT_CLIENT.getAvatar({
                            path: {
                                avatarId: avatar
                            }
                        });

                        if (avatarResponse.error) {
                            AVATAR_BROKEN_CACHE.set(avatar, true);
                            return;
                        }

                        const avatarData = {
                            id: avatar,
                            name: avatarResponse.data.name,
                            author: avatarResponse.data.authorName,
                        };

                        const endPointRequest = new URL(IMAGE_PROXY_URL);
                        endPointRequest.searchParams.set('url', avatarResponse.data.thumbnailImageUrl);

                        const imageResponse = await fetch(endPointRequest.toString());
                        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

                        const attachment = new AttachmentBuilder(imageBuffer, { name: `${avatar}.png` });
                        avatarData.image = attachment;

                        PrintMessage('Cached avatar "' + avatarResponse.data.name + '" by ' + avatarResponse.data.authorName);

                        AVATAR_DATA_CACHE.set(avatar, avatarData);
                    } catch (error) {
                        AVATAR_BROKEN_CACHE.set(avatar, true);
                    }
                });

                await Promise.allSettled(preloadPromises);
            })().catch(() => { }); // Ignorar errores del proceso en background
        }
    }

    return avatars;
}

async function getWorlds(query, page) {
    const response = await VRCHAT_CLIENT.searchWorlds({
        query: {
            search: query,
            n: WORLDS_PER_PAGE,
            offset: (page - 1) * WORLDS_PER_PAGE
        }
    });

    if (response.error) {
        return [];
    }

    return response.data || [];
};

async function getUsers(query, page) {
    const response = await VRCHAT_CLIENT.searchUsers({
        query: {
            search: query,
            n: USERS_PER_PAGE,
            offset: (page - 1) * USERS_PER_PAGE
        }
    });

    if (response.error) {
        return [];
    }

    return response.data || [];
};

// =================================================================================================
// Command Execution
// =================================================================================================

searchCommand.setExecute(async ({ interaction, locale, args }) => {
    await interaction.deferReply();

    const subcommand = args['subcommand'];
    const query = args['query'];

    const sanitizedQuery = query
        .replace(/@everyone/g, 'everyone')
        .replace(/@here/g, 'here')
        .replace(/<@!?\d+>/g, '')
        .trim();

    if (sanitizedQuery.length === 0) {
        return await interaction.editReply({
            content: locale['embed.no_results'],
            flags: MessageFlags.Ephemeral
        });
    }

    switch (subcommand) {
        case SUBCOMMANDS_NAME.WORLD:
            let worldPage = 1;
            const worlds = await getWorlds(query, worldPage);

            if (worlds.length === 0) {
                return await interaction.editReply({
                    content: locale['error.no_results'].replace('{query}', sanitizedQuery),
                    flags: MessageFlags.Ephemeral
                });
            }

            const worldComponent = createWorldEmbed(worlds, locale, worldPage);
            const worldMessage = await interaction.editReply({
                components: [worldComponent],
                flags: MessageFlags.IsComponentsV2
            });

            const worldCollector = worldMessage.createMessageComponentCollector({
                componentType: ComponentType.Button,
                filter: (i) => i.user.id === interaction.user.id,
                time: 5 * 60 * 1000
            });

            worldCollector.on('collect', async (i) => {
                if (!i.deferred) {
                    await i.deferUpdate();
                }

                if (i.customId === 'previous') {
                    worldPage--;
                } else if (i.customId === 'next') {
                    worldPage++;
                }

                const newWorlds = await getWorlds(query, worldPage);
                const newComponent = createWorldEmbed(newWorlds, locale, worldPage);

                await i.editReply({
                    components: [newComponent],
                    flags: MessageFlags.IsComponentsV2
                });
            });

            break;

        case SUBCOMMANDS_NAME.AVATAR:
            let currentPage = 1;

            const avatars = await getAvatars(currentPage, query);
            if (avatars.length === 0) {
                return await interaction.editReply({
                    content: locale['embed.no_results'],
                    flags: MessageFlags.Ephemeral
                });
            }

            const component = createAvatarEmbed(avatars, locale, currentPage);
            const message = await interaction.editReply({
                components: [component],
                flags: MessageFlags.IsComponentsV2,
                files: avatars.map((avatar) => avatar.image)
            })

            const collector = message.createMessageComponentCollector({
                componentType: ComponentType.Button,
                filter: (i) => i.user.id === interaction.user.id,
                time: 5 * 60 * 1000
            });

            collector.on('collect', async (i) => {
                if (!i.deferred) {
                    await i.deferUpdate();
                }

                if (i.customId === 'previous') {
                    currentPage--;
                } else if (i.customId === 'next') {
                    currentPage++;
                }

                const avatars = await getAvatars(currentPage, query);
                const component = createAvatarEmbed(avatars, locale, currentPage);

                await i.editReply({
                    files: avatars.map((avatar) => avatar.image),
                    flags: MessageFlags.IsComponentsV2,
                    components: [component]
                });
            });

            break;

        case SUBCOMMANDS_NAME.USER:
            let userPage = 1;
            const users = await getUsers(query, userPage);

            if (users.length === 0) {
                return await interaction.editReply({
                    content: locale['error.no_results'].replace('{query}', sanitizedQuery),
                    flags: MessageFlags.Ephemeral
                });
            }

            const userComponent = createUserEmbed(users, locale, userPage);
            const userMessage = await interaction.editReply({
                components: [userComponent],
                flags: MessageFlags.IsComponentsV2
            });

            const userCollector = userMessage.createMessageComponentCollector({
                componentType: ComponentType.Button,
                filter: (i) => i.user.id === interaction.user.id,
                time: 5 * 60 * 1000
            });

            userCollector.on('collect', async (i) => {
                if (!i.deferred) {
                    await i.deferUpdate();
                }

                if (i.customId === 'previous') {
                    userPage--;
                } else if (i.customId === 'next') {
                    userPage++;
                }

                const newUsers = await getUsers(query, userPage);
                const newUserComponent = createUserEmbed(newUsers, locale, userPage);

                await i.editReply({
                    components: [newUserComponent],
                    flags: MessageFlags.IsComponentsV2
                });
            });

            break; // TO DO
    }

    return;
});

// =================================================================================================
// Exports
// =================================================================================================

module.exports = RegisterCommand([searchCommand]);

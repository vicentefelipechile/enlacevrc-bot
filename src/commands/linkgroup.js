/**
 * @file        commands/linkgroup.js
 * @author      vicentefelipechile
 * @description Command to allow server admins to link a VRChat group with the Discord bot.
 */

// =================================================================================================
// Import Statements
// =================================================================================================

const { Locale, EmbedBuilder, ActionRowBuilder, ButtonStyle, MessageFlags, Colors, AttachmentBuilder, PermissionFlagsBits, ContainerBuilder, SectionBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, ThumbnailBuilder, MediaGalleryBuilder } = require("discord.js");
const { ModularCommand, RegisterCommand } = require("js-discord-modularcommand");
const NodeCache = require("node-cache");
const { D1Class } = require("../d1class");
const DISCORD_SERVER_SETTINGS = require("../discordsettings");
const { VRCHAT_CLIENT } = require("../vrchat");
const { VRCHAT_APPLICATION_NAME } = require("../env");

// =================================================================================================
// Variables
// =================================================================================================

const linkGroupCommand = new ModularCommand('linkgroup')
    .setDescription('Link a VRChat group with this Discord server.')
    .setCooldown(10);

/**
 * @typedef {Object} LinkGroupState
 * @property {string} inviteId - ID de la invitación de VRChat
 * @property {string} groupId - ID del grupo de VRChat
 * @property {string} groupName - Nombre del grupo de VRChat
 * @property {string} serverId - ID del servidor de Discord
 */

/**
 * Cache para almacenar el estado de vinculación temporal (5 minutos)
 * @type {NodeCache}
 */
const LINK_GROUP_STATE = new NodeCache({ stdTTL: 5 * 60 });

// Imágenes instructivas
const errorImage = new AttachmentBuilder('img/error.jpg', { name: 'error.jpg' });
const errorUrl = 'attachment://' + errorImage.name;

const warningImage = new AttachmentBuilder('img/warning.jpg', { name: 'warning.jpg' });
const warningUrl = 'attachment://' + warningImage.name;

const successImage = new AttachmentBuilder('img/success.jpg', { name: 'success.jpg' });
const successUrl = 'attachment://' + successImage.name;

// TODO: Crear estas imágenes/videos
// const linkGroupInviteVideo = new AttachmentBuilder('img/linkgroup-invite.webm', { name: 'linkgroup-invite.webm' });
// const linkGroupLogChannelImage = new AttachmentBuilder('img/linkgroup-logchannel.jpg', { name: 'linkgroup-logchannel.jpg' });

// =================================================================================================
// Permission Check
// =================================================================================================

linkGroupCommand.setPermissionCheck(async (interaction) => {
    const member = interaction.member;
    if (!member || !member.permissions) {
        return false;
    }

    return member.permissions.has(PermissionFlagsBits.Administrator);
});

// =================================================================================================
// Localization
// =================================================================================================

linkGroupCommand.setLocalizationDescription({
    [Locale.EnglishUS]: 'Link a VRChat group with this Discord server.',
    [Locale.SpanishLATAM]: 'Vincula un grupo de VRChat con este servidor de Discord.',
    [Locale.SpanishES]: 'Vincula un grupo de VRChat con este server de Discord, tronco.',
});

linkGroupCommand.setLocalizationPhrases({
    [Locale.EnglishUS]: {
        // Error messages
        'error.not_linked': '❌ **Account Not Linked**\n\nTo link a VRChat group, you first need to link your VRChat account with Discord.\n\n**Steps to follow:**\n1. Use the `/verification` command to start the process\n2. Follow the instructions to link your account\n3. Once linked, try `/linkgroup` again',
        'error.no_permission': '🚫 **Insufficient Permissions**\n\nYou need **Administrator** permissions in this Discord server to link a VRChat group.\n\n**How to get permissions:**\nAsk a server administrator to grant you the Administrator role.',
        'error.no_log_channel': '⚠️ **Log Channel Not Configured**\n\nTo ensure transparency, you need to configure a channel where all bot actions will be logged.\n\n**What is the log_channel?**\nIt\'s a channel where a record of all actions performed by users with permissions in the VRChat group will be saved.\n\n**How to configure it:**\n1. Use the `/settings log_channel` command\n2. Select the channel where you want to receive the logs\n3. Try `/linkgroup` again',
        'error.no_log_channel_while_accepting_terms': '⚠️ **Log Channel Deleted**\n\nWHY, IS JUST, WHY YOU REMOVED THE LOG CHANNEL BEFORE ACCEPTING TERMS? ARE YOU STUPID?',
        'error.log_channel_not_found': '❌ **Log Channel Not Found**\n\nThe configured log channel was not found.\n\n**How to fix it:**\n1. Use the `/settings log_channel` command\n2. Select the channel where you want to receive the logs\n3. Try `/linkgroup` again',
        'error.no_invitations': '🔍 **No Invitations Found**\n\nNo pending invitation to the VRChat group was found.\n\n**Make sure you\'ve followed these steps:**\n 1. Open VRChat on your computer or VR\n 2. Go to your VRChat group\n 3. Access the "Members" section\n 4. Click on "Invite"\n 5. Search for the bot by its VRChat username\n 6. Send the invitation\n 7. Return to Discord and press the button again',
        'error.invalid_invitation': '🚫 **Invalid Invitation**\n\nThe invitation found is not valid because it doesn\'t meet the requirements.\n\n**Requirements to link the bot:**\n- You must be the **group owner** in VRChat, OR\n- You must have **Administrator** permissions in this Discord server\n\n**Verify that:**\n1. You\'re inviting the bot from the correct group\n2. You are the owner of the group in VRChat\n3. Or you have Administrator permissions in Discord\n\nIf you meet these requirements, try inviting the bot again.',
        'error.generic': '❌ **An Error Occurred**\n\nSomething went wrong while processing your request. Please try again later.\n\nIf the problem persists, contact the bot administrator.',

        // Initial message
        'initial.title': '🔗 Link VRChat Group',
        'initial.description': 'To link your VRChat group with this Discord server, follow these steps:\n 1. Open VRChat on your computer or VR\n 2. Go to your VRChat group\n 3. Access the "Members" section\n 4. Click on "Invite"\n 5. Search for the bot by its VRChat username```{VRCHAT_APPLICATION_NAME}```\n 6. Send the invitation\n 7. Return to Discord and press the button again'.replace('{VRCHAT_APPLICATION_NAME}', VRCHAT_APPLICATION_NAME),
        'initial.button': 'I\'ve invited the bot',

        // Terms and conditions
        'terms.title': '📋 Terms and Conditions',
        'terms.description': 'Before linking the bot to your VRChat group, please read and accept the following terms:',
        'terms.point1': '**1. The bot is a tool**The bot does not make decisions on its own. All actions are performed by users with permissions.',
        'terms.point2': '**2. Action logging**All actions performed will be logged in the configured log channel {log_channel}.',
        'terms.point3': '**3. Audit trail**Actions have an auto-incremental ID to prevent evidence tampering. A copy is also stored in the database.',
        'terms.point4': '**4. Responsibility**The bot owner is not responsible for misuse of the bot in the VRChat group. By accepting, you acknowledge the consequences of inviting the bot.',
        'terms.point5': '**5. Invitation**Currently you are inviting the bot to the group ```{groupName}```',
        'terms.accept': 'Accept',
        'terms.reject': 'Reject',

        // Success messages
        'success.title': '✅ Group Successfully Linked!',
        'success.description': 'The VRChat group **{groupName}** has been successfully linked to this Discord server.\n\nAll actions performed by users with permissions will be logged in the configured channel.',
        'cancelled': 'Process cancelled.',

        // Registro de acciones
        'log.action.title': 'Bot has joined the group',
        'log.action.by': 'Action made by {user}',
        'log.action.actionid': '**Group**: {vrchat_group_id}\n**Action ID**: {action_id}',

        // Buttons
        'button.help_verification': '📖 See Verification Tutorial',
        'button.help_invite': '📺 See Invitation Tutorial',
        'linkgroup.invited': 'I\'ve invited the bot to the group',
        'linkgroup.acceptterms': 'Accept',
        'linkgroup.rejectterms': 'Reject',
    },
    [Locale.SpanishLATAM]: {
        // Mensajes de error
        'error.not_linked': '❌ **Cuenta No Vinculada**\n\nPara vincular un grupo de VRChat, primero debes vincular tu cuenta de VRChat con Discord.\n\n**Pasos a seguir:**\n1. Usa el comando `/verification` para iniciar el proceso\n2. Sigue las instrucciones para vincular tu cuenta\n3. Una vez vinculado, intenta `/linkgroup` nuevamente',
        'error.no_permission': '🚫 **Permisos Insuficientes**\n\nNecesitas permisos de **Administrador** en este servidor de Discord para vincular un grupo de VRChat.\n\n**Cómo obtener permisos:**\nPide a un administrador del servidor que te otorgue el rol de Administrador.',
        'error.no_log_channel': '⚠️ **Canal de Registros No Configurado**\n\nPara garantizar la transparencia, necesitas configurar un canal donde se registrarán todas las acciones del bot.\n\n**¿Qué es el log_channel?**\nEs un canal donde se guardará un registro de todas las acciones realizadas por usuarios con permisos en el grupo de VRChat.\n\n**Cómo configurarlo:**\n1. Usa el comando `/settings log_channel`\n2. Selecciona el canal donde quieres recibir los registros\n3. Intenta `/linkgroup` nuevamente',
        'error.no_log_channel_while_accepting_terms': '⚠️ **Canal de Registros Eliminado**\n\nPERO WEON, ¿PARA QUE BORRAS EL CANAL DE LOGS? ¿ERES WECO O QUE?',
        'error.log_channel_not_found': '❌ **Canal de Registros No Encontrado**\n\nEl canal de registros configurado no se encontró.\n\n**Cómo solucionarlo:**\n1. Usa el comando `/settings log_channel`\n2. Selecciona el canal donde quieres recibir los registros\n3. Intenta `/linkgroup` nuevamente',
        'error.no_invitations': '🔍 **No Se Encontraron Invitaciones**\n\nNo se encontró ninguna invitación pendiente al grupo de VRChat.\n\n**Asegúrate de haber seguido estos pasos:**\n 1. Abre VRChat en tu computadora o VR\n 2. Ve a tu grupo de VRChat\n 3. Accede a la sección de "Members" (Miembros)\n 4. Haz clic en "Invite" (Invitar)\n 5. Busca al bot por su nombre de usuario de VRChat\n 6. Envía la invitación\n 7. Regresa a Discord y presiona el botón nuevamente',
        'error.invalid_invitation': '🚫 **Invitación No Válida**\n\nLa invitación encontrada no es válida porque no cumple con los requisitos.\n\n**Requisitos para vincular el bot:**\n- Debes ser el **dueño del grupo** en VRChat, O\n- Debes tener permisos de **Administrador** en este servidor de Discord\n\n**Verifica que:**\n1. Estás invitando al bot desde el grupo correcto\n2. Eres el propietario del grupo en VRChat\n3. O tienes permisos de Administrador en Discord\n\nSi cumples con los requisitos, intenta invitar al bot nuevamente.',
        'error.generic': '❌ **Ocurrió un Error**\n\nAlgo salió mal al procesar tu solicitud. Por favor, inténtalo de nuevo más tarde.\n\nSi el problema persiste, contacta al administrador del bot.',

        // Mensaje inicial
        'initial.title': '🔗 Vincular Grupo de VRChat',
        'initial.description': 'Para vincular tu grupo de VRChat con este servidor de Discord, sigue estos pasos:\n 1. Abre VRChat y ve a tu grupo\n 2. Ve a la sección "Members" (Miembros)\n 3. Haz clic en "Invite" (Invitar) y busca al bot con el nombre ```{VRCHAT_APPLICATION_NAME}```\n 4. Envía la invitación al bot\n 5. Regresa aquí y haz clic en el botón de abajo'.replace('{VRCHAT_APPLICATION_NAME}', VRCHAT_APPLICATION_NAME),
        'initial.button': 'He invitado al bot',

        // Términos y condiciones
        'terms.title': '📋 Términos y Condiciones',
        'terms.description': 'Antes de vincular el bot a tu grupo de VRChat, por favor lee y acepta los siguientes términos:',
        'terms.point1': '**1. El bot es una herramienta**El bot no toma decisiones por sí mismo. Todas las acciones son realizadas por usuarios con permisos.',
        'terms.point2': '**2. Registro de acciones**Todas las acciones realizadas serán registradas en el canal {log_channel}.',
        'terms.point3': '**3. Trazabilidad**Las acciones tienen un ID autoincremental para evitar manipulación de evidencias. También se crea una copia en la base de datos.',
        'terms.point4': '**4. Responsabilidad**El dueño del bot no se responsabiliza por el mal uso del bot en el grupo de VRChat. Al aceptar, reconoces las consecuencias de invitar al bot.',
        'terms.point5': '**5. Invitación**Actualmente estas invitando el bot al grupo ```{groupName}```',
        'terms.accept': 'Aceptar',
        'terms.reject': 'Rechazar',

        // Mensajes de éxito
        'success.title': '✅ ¡Grupo Vinculado Exitosamente!',
        'success.description': 'El grupo de VRChat **{groupName}** ha sido vinculado exitosamente a este servidor de Discord.\n\nTodas las acciones realizadas por usuarios con permisos serán registradas en el canal configurado.',
        'cancelled': 'Proceso cancelado.',

        // Registro de acciones
        'log.action.title': 'El bot se ha unido al grupo {groupName}',
        'log.action.by': 'Accion realizada por {user}',
        'log.action.actionid': '**Grupo**: {vrchat_group_id}\n**ID de la accion**: {action_id}',

        // Botones
        'button.help_verification': '📖 Ver Tutorial de Verificación',
        'button.help_invite': '📺 Ver Tutorial de Invitación',
        'linkgroup.invited': 'Ya he invitado al bot',
        'linkgroup.acceptterms': 'Aceptar',
        'linkgroup.rejectterms': 'Rechazar',
    },
    [Locale.SpanishES]: {
        // Mensajes de error
        'error.not_linked': '❌ **¡Eh, Willy! Cuenta Sin Vincular**\n\n¡A ver, tronco! Para vincular un grupo de VRChat, primero tienes que vincular tu cuenta de VRChat con Discord, que no es tan difícil.\n\n**Pasos a seguir:**\n1. Usa el comando `/verification` para empezar, ¿vale?\n2. Sigue las instrucciones pa vincular tu cuenta\n3. Una vez vinculado, le das otra vez al `/linkgroup`, colega',
        'error.no_permission': '🚫 **¡Ojo, Chaval! Permisos Insuficientes**\n\nPara vincular un grupo de VRChat necesitas ser **Administrador** en este server de Discord, que no es poco.\n\n**Cómo conseguir permisos:**\nPídele a un admin del server que te dé el rol de Administrador, anda.',
        'error.no_log_channel': '⚠️ **¡Madre mía! Canal de Registros Sin Configurar**\n\nPara que todo quede clarito y transparente, necesitas configurar un canal donde se apuntarán todas las acciones del bot.\n\n**¿Qué es el log_channel?**\nEs un canal donde se guardará to lo que hagan los usuarios con permisos en el grupo de VRChat. Así na se pierde.\n\n**Cómo configurarlo:**\n1. Usa el comando `/settings log_channel`, tronco\n2. Selecciona el canal donde quieres recibir los registros\n3. Intenta `/linkgroup` otra vez, figura',
        'error.log_channel_not_found': '❌ **¡Madre mía! Canal de Registros No Encontrado**\n\nEl canal de registros configurado no se encontró, colega.\n\n**Cómo solucionarlo:**\n1. Usa el comando `/settings log_channel`\n2. Selecciona el canal donde quieres recibir los registros\n3. Intenta `/linkgroup` otra vez, figura',
        'error.no_log_channel_while_accepting_terms': '⚠️ **¡Pero qué haces, alma de cántaro!**\n\n¿Pero tú eres tonto o qué te pasa? ¿Para qué borras el canal de logs justo cuando estás aceptando los términos? ¡Me cago en diez, que me has dejado a cuadros! ¿Es que no tienes dos dedos de frente o qué?',
        'error.no_invitations': '🔍 **¡Joder! No Hay Invitaciones**\n\nQue no encuentro ninguna invitación pendiente al grupo de VRChat, macho.\n\n**Asegúrate de haber hecho esto:**\n1. Abre VRChat en tu PC o en VR\n2. Ve a tu grupo de VRChat\n3. Métete en la sección de "Members" (Miembros)\n4. Dale a "Invite" (Invitar)\n5. Busca al bot por su nombre de usuario de VRChat\n6. Mándale la invitación\n7. Vuelve a Discord y dale al botón otra vez',
        'error.invalid_invitation': '🚫 **¡Nanay de la China! Invitación No Válida**\n\nLa invitación que he encontrado no vale porque no cumple con los requisitos, colega.\n\n**Requisitos para vincular el bot:**\n- Tienes que ser el **dueño del grupo** en VRChat, O\n- Tienes que tener permisos de **Administrador** en este server de Discord\n\n**Verifica esto:**\n1. Estás invitando al bot desde el grupo correcto\n2. Eres el propietario del grupo en VRChat\n3. O tienes permisos de Administrador en Discord\n\nSi cumples con los requisitos, prueba a invitar al bot otra vez.',
        'error.generic': '❌ **¡Hostia Puta! Ha Petado Algo**\n\nAlgo ha ido mal al procesar tu petición, tronco. Prueba otra vez más tarde.\n\nSi el problema sigue, habla con el admin del bot.',

        // Mensaje inicial
        'initial.title': '🔗 Vincular Grupo de VRChat',
        'initial.description': 'Para vincular tu grupo de VRChat con este server de Discord, haz esto que es pan comido:\n 1. Abre VRChat y ve a tu grupo\n 2. Ve a la sección "Members" (Miembros)\n 3. Dale a "Invite" (Invitar) y busca al bot ```{VRCHAT_APPLICATION_NAME}```\n 4. Mándale la invitación al bot\n 5. Vuelve aquí y dale al botón de abajo'.replace('{VRCHAT_APPLICATION_NAME}', VRCHAT_APPLICATION_NAME),
        'initial.button': 'Ya he invitado al bot',

        // Términos y condiciones
        'terms.title': '📋 Términos y Condiciones',
        'terms.description': 'Antes de vincular el bot a tu grupo de VRChat, lee esto y acepta los términos, ¿vale?',
        'terms.point1': '**1. El bot es solo una herramienta**El bot no decide na por sí mismo. To las acciones las hacen usuarios con permisos.',
        'terms.point2': '**2. Registro de acciones**To las acciones que se hagan quedarán registradas en el canal {log_channel}.',
        'terms.point3': '**3. Trazabilidad**Las acciones tienen un ID autoincremental pa evitar que alguien la lie con las pruebas. También se guarda una copia en la base de datos.',
        'terms.point4': '**4. Responsabilidad**El dueño del bot no se hace responsable del mal uso del bot en el grupo de VRChat. Al aceptar, tú te haces cargo de las consecuencias de meter al bot.',
        'terms.point5': '**5. Invitación**Actualmente estas invitando el bot al grupo ```{groupName}```',
        'terms.accept': 'Acepto, venga',
        'terms.reject': 'Paso, mejor no',

        // Mensajes de éxito
        'success.title': '✅ ¡Grupo Vinculado, Crack!',
        'success.description': 'El grupo de VRChat **{groupName}** se ha vinculado con éxito a este server de Discord.\n\nTo las acciones que hagan usuarios con permisos quedarán registradas en el canal configurado.',
        'cancelled': 'Proceso cancelado, tronco.',

        // Registro de acciones
        'log.action.title': 'El bot se ha unido al grupo {groupName}',
        'log.action.by': 'Accion realizada por {user}',
        'log.action.actionid': '**Grupo**: {vrchat_group_id}\n**ID de la accion**: {action_id}',

        // Botones
        'button.help_verification': '📖 Ver Tutorial de Verificación',
        'button.help_invite': '📺 Ver Tutorial de Invitación',
        'linkgroup.invited': 'Ya he invitado al bot',
        'linkgroup.acceptterms': 'Aceptar',
        'linkgroup.rejectterms': 'Rechazar',
    }
});

// =================================================================================================
// Helper Functions
// =================================================================================================

/**
 * Creates an error embed with the error image
 * @param {string} contentText - Error message
 * @param {Colors} color - Embed color
 * @returns {Object} - { embed, files }
 */
function createErrorEmbed(contentText, color = Colors.Red) {
    const container = new ContainerBuilder()
        .setAccentColor(color)
        .addSectionComponents(
            new SectionBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder({ content: contentText })
                )
                .setThumbnailAccessory(
                    new ThumbnailBuilder({
                        media: {
                            url: errorUrl
                        }
                    })
                )
        )

    return { components: [container], files: [errorImage] };
}

// =================================================================================================
// Button Handlers
// =================================================================================================

const buttonInvited = linkGroupCommand.addButton('invited', async ({ interaction, locale }) => {
    await interaction.deferUpdate();

    const userId = interaction.user.id;
    const serverId = interaction.guild.id;

    const userRequestData = {
        discord_id: userId,
        discord_name: interaction.user.username
    };

    try {
        // Obtener perfil del usuario para verificar que esté vinculado
        let profileData = null;
        try {
            profileData = await D1Class.getProfile(userRequestData, userId, false);
        } catch (error) {
            const { components, files } = createErrorEmbed(locale['error.not_linked']);
            return interaction.editReply({
                components,
                files,
                flags: MessageFlags.IsComponentsV2
            });
        }

        if (!profileData || !profileData.vrchat_id) {
            const { components, files } = createErrorEmbed(locale['error.not_linked']);
            return interaction.editReply({
                components,
                files,
                flags: MessageFlags.IsComponentsV2
            });
        }

        // Buscar notificaciones de VRChat
        const notificationsResponse = await VRCHAT_CLIENT.listNotifications();
        const notifications = notificationsResponse.data;

        // Filtrar solo invitaciones a grupos
        const groupInvites = notifications.filter(n => n.type === 'group.invite');

        if (groupInvites.length === 0) {
            const { components, files } = createErrorEmbed(locale['error.no_invitations'], Colors.Orange);
            return interaction.editReply({
                components,
                files,
                flags: MessageFlags.IsComponentsV2
            });
        }

        // Buscar una invitación válida (enviada por el usuario actual)
        let validInvite = null;
        let groupData = null;

        for (const invite of groupInvites) {
            // Extraer ID del grupo desde el link
            const groupId = invite.link.replace('group:', '');

            // Obtener información del grupo
            const groupResponse = await VRCHAT_CLIENT.getGroup({
                path: { groupId }
            });

            const group = groupResponse.data;

            // Verificar si el usuario es el dueño del grupo
            if (group.ownerId === profileData.vrchat_id) {
                validInvite = invite;
                groupData = group;
                break;
            }
        }

        if (!validInvite) {
            const { components, files } = createErrorEmbed(locale['error.invalid_invitation'], Colors.Orange);
            return interaction.editReply({
                components,
                files,
                flags: MessageFlags.IsComponentsV2
            });
        }

        // Guardar el estado para el siguiente paso
        LINK_GROUP_STATE.set(userId, {
            inviteId: validInvite.id,
            groupId: groupData.id,
            groupName: groupData.name,
            serverId: serverId
        });

        const logChannelConfig = await D1Class.getDiscordSetting(userRequestData, serverId, DISCORD_SERVER_SETTINGS.LOG_CHANNEL);
        const logChannel = interaction.guild.channels.cache.get(logChannelConfig);

        if (!logChannel) {
            const { components, files } = createErrorEmbed(locale['error.log_channel_not_found'], Colors.Orange);
            return interaction.editReply({
                components,
                files,
                flags: MessageFlags.IsComponentsV2
            });
        }

        const component = new ContainerBuilder()
            .setAccentColor(Colors.Blue)
            .addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder({
                            content:
                                "# " + locale['terms.title'] + "\n" +
                                locale['terms.description']
                        })
                    )
                    .setThumbnailAccessory(
                        new ThumbnailBuilder({
                            media: {
                                url: warningUrl
                            }
                        })
                    )
            )
            .addSeparatorComponents(
                new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder({
                    content:
                        locale['terms.point1'] + "\n" +
                        locale['terms.point2'].replace("{log_channel}", `<#${logChannelConfig}>`) + "\n" +
                        locale['terms.point3'] + "\n" +
                        locale['terms.point4']
                })
            )
            .addSeparatorComponents(
                new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder({
                    content:
                        locale['terms.point5'].replace("{groupName}", groupData.name)
                })
            )
            .addMediaGalleryComponents(
                new MediaGalleryBuilder()
                    .addItems({
                        media: {
                            url: groupData.iconUrl
                        }
                    })
            )
            .addSeparatorComponents(
                new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
            )
            .addActionRowComponents(
                new ActionRowBuilder()
                    .addComponents(
                        buttonAcceptTerms.build(locale),
                        buttonRejectTerms.build(locale)
                    )
            );

        await interaction.editReply({
            components: [component],
            files: [warningImage],
            flags: MessageFlags.IsComponentsV2
        });

    } catch (error) {
        console.error('Error processing group invitation:', error);
        const { components, files } = createErrorEmbed(locale['error.generic']);
        await interaction.editReply({
            components,
            files,
            flags: MessageFlags.IsComponentsV2
        });
    }
});

buttonInvited.getButton().setStyle(ButtonStyle.Primary).setEmoji('✅');

const buttonAcceptTerms = linkGroupCommand.addButton('acceptterms', async ({ interaction, locale }) => {
    await interaction.deferUpdate();

    const userId = interaction.user.id;
    /** @type {LinkGroupState | undefined} */
    const state = LINK_GROUP_STATE.get(userId);

    if (!state) {
        const { components, files } = createErrorEmbed(locale['error.generic']);
        return interaction.editReply({
            components,
            files,
            flags: MessageFlags.IsComponentsV2
        });
    }

    const userRequestData = {
        discord_id: userId,
        discord_name: interaction.user.username
    };

    const logChannelId = await D1Class.getDiscordSetting(userRequestData, interaction.guildId, DISCORD_SERVER_SETTINGS.LOG_CHANNEL);
    const logChannel = interaction.guild.channels.cache.get(logChannelId);
    if (!logChannel) {
        const { components, files } = createErrorEmbed(locale['error.no_log_channel_while_accepting_terms']);
        return interaction.editReply({
            components,
            files,
            flags: MessageFlags.IsComponentsV2
        });
    }

    try {
        // Aceptar la invitación al grupo en VRChat
        await VRCHAT_CLIENT.joinGroup({
            path: {
                groupId: state.groupId
            }
        });

        // Guardar la vinculación en la base de datos
        const response = await D1Class.addVRChatGroup(
            userRequestData,
            state.groupId,
            state.serverId,
            state.groupName
        );

        // Limpiar el estado
        LINK_GROUP_STATE.del(userId);

        // Mensaje de éxito
        const component = new ContainerBuilder()
            .setAccentColor(Colors.Green)
            .addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder({ content: locale['success.title'] })
                    )
                    .setThumbnailAccessory(
                        new ThumbnailBuilder({
                            media: {
                                url: successUrl
                            }
                        })
                    )
            )
            .addSeparatorComponents(
                new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder({ content: locale['success.description'].replace('{groupName}', state.groupName) })
            )

        await interaction.editReply({
            components: [component],
            files: [successImage],
            flags: MessageFlags.IsComponentsV2
        });

        const embed = new EmbedBuilder()
            .setTitle(locale['log.action.title'].replace('{groupName}', state.groupName))
            .setDescription(locale['log.action.actionid'].replace('{action_id}', response.data.log_id).replace('{vrchat_group_id}', state.groupId))
            .setColor("Random")
            .setTimestamp()
            .setFooter({
                text: locale['log.action.by'].replace('{user}', interaction.user.username),
                iconURL: interaction.user.displayAvatarURL()
            });

        await logChannel.send({ embeds: [embed] });

    } catch (error) {
        console.error('Error accepting group invitation:', error);
        const { components, files } = createErrorEmbed(locale['error.generic']);
        await interaction.editReply({
            components,
            files,
            flags: MessageFlags.IsComponentsV2
        });
    }
});

buttonAcceptTerms.getButton().setStyle(ButtonStyle.Success).setEmoji('✅');

const buttonRejectTerms = linkGroupCommand.addButton('rejectterms', async ({ interaction, locale }) => {
    await interaction.deferUpdate();

    const userId = interaction.user.id;
    LINK_GROUP_STATE.del(userId);

    const component = new ContainerBuilder()
        .setAccentColor(Colors.Red)
        .addTextDisplayComponents(
            new TextDisplayBuilder({ content: locale['cancelled'] })
        );

    await interaction.editReply({
        components: [component],
        files: []
    });
});

buttonRejectTerms.getButton().setStyle(ButtonStyle.Danger).setEmoji('✖️');

// =================================================================================================
// Command Execution
// =================================================================================================

linkGroupCommand.setExecute(async ({ interaction, locale }) => {
    await interaction.deferReply();

    const userId = interaction.user.id;
    const serverId = interaction.guild.id;

    const userRequestData = {
        discord_id: userId,
        discord_name: interaction.user.username
    };

    try {
        // Validación 1: Usuario vinculado
        let profileData = null;
        try {
            profileData = await D1Class.getProfile(userRequestData, userId, false);
        } catch (error) {
            const { components, files } = createErrorEmbed(locale['error.not_linked']);
            return interaction.editReply({
                components,
                files,
                flags: MessageFlags.IsComponentsV2
            });
        }

        if (!profileData || !profileData.vrchat_id) {
            const { components, files } = createErrorEmbed(locale['error.not_linked']);
            return interaction.editReply({
                components,
                files,
                flags: MessageFlags.IsComponentsV2
            });
        }

        // Validación 2: Log channel configurado
        const settings = await D1Class.getAllDiscordSettings(userRequestData, serverId);
        const logChannelId = settings[DISCORD_SERVER_SETTINGS.LOG_CHANNEL];

        const logChannel = interaction.guild.channels.cache.get(logChannelId);
        if (!logChannel) {
            const { components, files } = createErrorEmbed(locale['error.no_log_channel'], Colors.Orange);
            return interaction.editReply({
                components,
                files,
                flags: MessageFlags.IsComponentsV2
            });
        }

        // Mostrar instrucciones para invitar al bot
        const component = new ContainerBuilder()
            .setAccentColor(Colors.Blue)
            .addTextDisplayComponents(
                new TextDisplayBuilder({ content: '# ' + locale['initial.title'] })
            )
            .addSeparatorComponents(
                new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder({ content: locale['initial.description'] })
            )
            .addSeparatorComponents(
                new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
            )
            .addActionRowComponents(
                new ActionRowBuilder()
                    .addComponents(buttonInvited.build(locale))
            );

        await interaction.editReply({
            components: [component],
            flags: MessageFlags.IsComponentsV2
        });

    } catch (error) {
        console.error('Error in linkgroup command:', error);
        const { components, files } = createErrorEmbed(locale['error.generic']);
        await interaction.editReply({
            components,
            files,
            flags: MessageFlags.IsComponentsV2
        });
    }
});

// =================================================================================================
// Exports
// =================================================================================================

module.exports = RegisterCommand([linkGroupCommand]);

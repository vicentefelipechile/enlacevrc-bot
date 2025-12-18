/**
 * @file        models/discordsettings.js
 * @author      vicentefelipechile
 * @description Discord settings definitions for loading and saving settings
 */

const DISCORD_SERVER_SETTINGS = {
    VERIFICATION_ROLE: 'verification_role',
    VERIFICATION_PLUS_ROLE: 'verification_plus_role',
    VERIFICATION_CHANNEL: 'verification_channel',
    AUTO_NICKNAME: 'auto_nickname',
    WELCOME_MESSAGE: 'welcome_message',
    LOG_CHANNEL: 'log_channel',
    MIN_TRUST_LEVEL: 'min_trust_level',
    AUTO_UNLINK: 'auto_unlink',
}

module.exports = DISCORD_SERVER_SETTINGS;
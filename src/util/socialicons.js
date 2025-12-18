/**
 * @license     MIT
 * @file        src/util/socialicons.js
 * @author      vicentefelipechile
 * @description Map social networks to emojis and detect social networks from URLs
 */

/**
 * Map of social network domains to emojis
 */
const SOCIAL_NETWORK_EMOJIS = {
    // Twitter/X
    'twitter.com': '🐦',
    'x.com': '🐦',

    // Facebook
    'facebook.com': '📘',
    'fb.com': '📘',

    // Instagram
    'instagram.com': '📷',

    // YouTube
    'youtube.com': '🎥',
    'youtu.be': '🎥',

    // Twitch
    'twitch.tv': '🎮',

    // Discord
    'discord.gg': '💬',
    'discord.com': '💬',

    // TikTok
    'tiktok.com': '🎵',

    // LinkedIn
    'linkedin.com': '💼',

    // GitHub
    'github.com': '💻',

    // Reddit
    'reddit.com': '🔴',

    // Telegram
    't.me': '✈️',
    'telegram.org': '✈️',

    // VRChat
    'vrchat.com': '🎮',

    // Patreon
    'patreon.com': '💰',

    // Ko-fi
    'ko-fi.com': '☕',
};

/**
 * Detect social network from URL and return emoji
 * @param {string} url - URL to check
 * @returns {string|null} Emoji if recognized, null otherwise
 */
function getEmojiForUrl(url) {
    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname.replace('www.', '');

        return SOCIAL_NETWORK_EMOJIS[hostname] || null;
    } catch (error) {
        return null;
    }
}

/**
 * Check if URL is a known social network
 * @param {string} url - URL to check
 * @returns {boolean} True if known social network
 */
function isKnownSocialNetwork(url) {
    return getEmojiForUrl(url) !== null;
}

/**
 * Extract URLs from text
 * @param {string} text - Text to extract URLs from
 * @returns {Array<string>} Array of URLs found
 */
function extractUrls(text) {
    if (!text) return [];

    // Regex to match URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
}

/**
 * Format URLs with emojis for display
 * @param {string} text - Text containing URLs
 * @returns {Object} Object with formatted_urls array and has_unknown_links boolean
 */
function formatUrlsWithEmojis(text) {
    const urls = extractUrls(text);
    const formattedUrls = [];
    let hasUnknownLinks = false;

    for (const url of urls) {
        const emoji = getEmojiForUrl(url);

        if (emoji) {
            formattedUrls.push(`${emoji} ${url}`);
        } else {
            formattedUrls.push(`🔗 ${url}`);
            hasUnknownLinks = true;
        }
    }

    return {
        formatted_urls: formattedUrls,
        has_unknown_links: hasUnknownLinks
    };
}

module.exports = {
    SOCIAL_NETWORK_EMOJIS,
    getEmojiForUrl,
    isKnownSocialNetwork,
    extractUrls,
    formatUrlsWithEmojis
};

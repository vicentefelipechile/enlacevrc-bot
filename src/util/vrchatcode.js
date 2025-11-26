const RegexURL = new RegExp(/^(?:https?:\/\/)?(?:www\.)?vrchat\.com\/home\/user\/(usr_[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12})$/);
const RegexID = new RegExp(/^(usr_[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12})$/);

function generateCodeByVRChat(vrchatId) {
    const idParts = vrchatId.substring(4).split('-');
    if (idParts.length !== 5) {
        throw new Error('Invalid VRChat ID format');
    }

    const firstPart = idParts[0];
    const lastPart = idParts[idParts.length - 1];
    const code = `${firstPart.substring(0, 3)}${lastPart.substring(lastPart.length - 3)}`.toUpperCase();
    return code;
}

    /**
     * Extract VRChat ID from URL or validate ID format
     * @param {string} vrchatId - VRChat URL or ID
     * @returns {string|null} - VRChat ID or null if invalid
     */
function getVRChatId(vrchatId) {
    const match = vrchatId.match(RegexURL);
    if (match && match[1]) return match[1];
    if (RegexID.test(vrchatId)) return vrchatId;
    return null;
}

module.exports = {
    generateCodeByVRChat,
    getVRChatId,
};
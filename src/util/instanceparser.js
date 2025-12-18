/**
 * @license     MIT
 * @file        src/util/instanceparser.js
 * @author      vicentefelipechile
 * @description Parse VRChat instance URLs and extract information
 */

/**
 * Instance type mappings
 */
const INSTANCE_TYPES = {
    'public': 'Public',
    'friends+': 'Friends+',
    'friends': 'Friends',
    'invite+': 'Invite+',
    'invite': 'Invite Only',
    'group': 'Group',
    'groupPlus': 'Group+',
    'groupPublic': 'Group Public'
};

/**
 * Region mappings
 */
const REGIONS = {
    'us': 'US West',
    'use': 'US East',
    'eu': 'Europe',
    'jp': 'Japan'
};

/**
 * Parse a VRChat instance URL or instance ID
 * @param {string} input - VRChat URL or instance ID
 * @returns {Object|null} Parsed instance data or null if invalid
 */
function parseVRChatInstance(input) {
    try {
        let worldId = null;
        let instanceId = null;

        // Check if input is a URL
        if (input.startsWith('http://') || input.startsWith('https://')) {
            const url = new URL(input);

            // Extract from URL parameters
            worldId = url.searchParams.get('worldId');
            instanceId = url.searchParams.get('instanceId');

            // If not in params, try to extract from path
            if (!worldId) {
                const pathMatch = url.pathname.match(/world\/(wrld_[a-f0-9-]+)/);
                if (pathMatch) {
                    worldId = pathMatch[1];
                }
            }
        } else {
            // Assume it's a direct instance string like "12345~private(usr_xxx)~region(us)"
            // or world ID like "wrld_xxx"
            if (input.startsWith('wrld_')) {
                worldId = input.split(':')[0];
                if (input.includes(':')) {
                    instanceId = input.split(':')[1];
                }
            } else {
                instanceId = input;
            }
        }

        if (!instanceId && !worldId) {
            return null;
        }

        // Parse instance ID if present
        let instanceNumber = null;
        let instanceType = 'public';
        let region = 'us';
        let ownerId = null;
        let nonce = null;

        if (instanceId) {
            // Format: 12345~private(usr_xxx)~region(us)~nonce(xxx)
            const parts = instanceId.split('~');

            // Instance number
            instanceNumber = parts[0];

            // Parse each part
            for (const part of parts) {
                // Instance type and owner
                const typeMatch = part.match(/^(public|friends\+?|invite\+?|group|groupPlus|groupPublic)(?:\((usr_[a-f0-9-]+)\))?$/);
                if (typeMatch) {
                    instanceType = typeMatch[1];
                    ownerId = typeMatch[2] || null;
                }

                // Region
                const regionMatch = part.match(/^region\((\w+)\)$/);
                if (regionMatch) {
                    region = regionMatch[1];
                }

                // Nonce
                const nonceMatch = part.match(/^nonce\(([a-f0-9-]+)\)$/);
                if (nonceMatch) {
                    nonce = nonceMatch[1];
                }
            }
        }

        return {
            world_id: worldId,
            instance_id: instanceId,
            instance_number: instanceNumber,
            instance_type: INSTANCE_TYPES[instanceType] || instanceType,
            instance_type_key: instanceType,
            region: REGIONS[region] || region.toUpperCase(),
            region_key: region,
            owner_id: ownerId,
            nonce: nonce,
            full_instance: worldId && instanceId ? `${worldId}:${instanceId}` : null
        };
    } catch (error) {
        console.error('Error parsing VRChat instance:', error);
        return null;
    }
}

/**
 * Check if a string is a valid VRChat world ID
 * @param {string} worldId - World ID to check
 * @returns {boolean} True if valid
 */
function isValidWorldId(worldId) {
    return /^wrld_[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(worldId);
}

/**
 * Check if string contains a VRChat URL
 * @param {string} text - Text to check
 * @returns {boolean} True if contains VRChat URL
 */
function containsVRChatUrl(text) {
    return /vrchat\.com\/home\/(launch|world)/i.test(text);
}

module.exports = {
    parseVRChatInstance,
    isValidWorldId,
    containsVRChatUrl,
    INSTANCE_TYPES,
    REGIONS
};

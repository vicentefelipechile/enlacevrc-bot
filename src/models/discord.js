/**
 * @file        models/discord.js
 * @author      vicentefelipechile
 * @description Discord Server Settings model class with CRUD operations
 */

// =================================================================================================
// Import Statements
// =================================================================================================

const { D1_URL, D1_PRIVATE_KEY } = require('../env');
const NodeCache = require('node-cache');
const Profile = require('./profile');

// =================================================================================================
// Discord Model Class
// =================================================================================================

/**
 * DiscordSettings model representing server-specific Discord settings with CRUD operations
 * @class DiscordSettings
 * @example
 * ## Basic Usage
 * ```javascript
 * // Add a new setting
 * const success = await DiscordSettings.add('123456789', 'welcome_channel', '987654321');
 * 
 * // Get a specific setting
 * const value = await DiscordSettings.get('123456789', 'welcome_channel');
 * 
 * // Get all settings for a server
 * const allSettings = await DiscordSettings.getAll('123456789');
 * 
 * // Update a setting
 * await DiscordSettings.update('123456789', 'welcome_channel', '111222333');
 * 
 * // Delete a setting
 * await DiscordSettings.delete('123456789', 'welcome_channel');
 * ```
 */
class DiscordSettings {
    constructor(discordServerId = null) {
        this.discordServerId = discordServerId;
        this.settingsData = {};
        this.isLoaded = false;
        
        if (!DiscordSettings._cache) {
            DiscordSettings._cache = new NodeCache({ stdTTL: 12 * 60 * 60 }); // Cache for 12 hours
        }

        if (!DiscordSettings._endpoint) {
            DiscordSettings._endpoint = `${D1_URL}/discord-settings`;
        }

        if (!DiscordSettings._headers) {
            DiscordSettings._headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${D1_PRIVATE_KEY}`
            };
        }
    }

    static async create(discordServerId) {
        if (!discordServerId) {
            throw new Error('Discord server ID is required to create an instance');
        }

        const instance = new DiscordSettings(discordServerId);
        await instance.load();
        return instance;
    }

    // =================================================================================================
    // Static CRUD Operations
    // =================================================================================================

    /**
     * Add a new Discord setting to the database
     * @param {string} discordServerId - Discord server ID
     * @param {string} settingKey - Setting key
     * @param {string} settingValue - Setting value
     * @returns {Promise<boolean>} - True if setting was added successfully
     */
    static async add(discordServerId, settingKey, settingValue) {
        try {
            if (!discordServerId || !settingKey || !settingValue) {
                throw new Error('Missing required parameters: discordServerId, settingKey, and settingValue are required');
            }

            const response = await fetch(`${DiscordSettings._endpoint}/${discordServerId}`, {
                method: 'POST',
                headers: DiscordSettings._headers,
                body: JSON.stringify({
                    setting_key: settingKey,
                    setting_value: settingValue
                })
            });

            const result = await response.json();
            return result.success === true;
        } catch (error) {
            console.error('Error adding Discord setting:', error.message);
            return false;
        }
    }

    /**
     * Get a specific Discord setting by server ID and setting key
     * @param {string} discordServerId - Discord server ID
     * @param {string} settingKey - Setting key
     * @returns {Promise<string|null>} - Setting value or null if not found
     */
    static async get(discordServerId, settingKey) {
        try {
            if (!discordServerId || !settingKey) {
                throw new Error('Missing required parameters: discordServerId and settingKey are required');
            }

            const url = new URL(`${DiscordSettings._endpoint}/${discordServerId}`);
            url.searchParams.append('setting_key', settingKey);

            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: DiscordSettings._headers
            });

            if (!response.ok) {
                return null;
            }

            const result = await response.json();
            return result.data && result.data[settingKey] ? result.data[settingKey] : null;
        } catch (error) {
            console.error('Error getting Discord setting:', error.message);
            return null;
        }
    }

    /**
     * Get all Discord settings for a server
     * @param {string} discordServerId - Discord server ID
     * @returns {Promise<Object|null>} - Object with all settings or null if none found
     */
    static async getAll(discordServerId) {
        try {
            if (!discordServerId) {
                throw new Error('Missing required parameter: discordServerId is required');
            }

            const url = new URL(`${DiscordSettings._endpoint}/${discordServerId}`);
            url.searchParams.append('getallsettings', 'true');

            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: DiscordSettings._headers
            });

            if (!response.ok) {
                return null;
            }

            const result = await response.json();
            return result.data || null;
        } catch (error) {
            console.error('Error getting all Discord settings:', error.message);
            return null;
        }
    }

    /**
     * Update an existing Discord setting
     * @param {string} discordServerId - Discord server ID
     * @param {string} settingKey - Setting key
     * @param {string} settingValue - New setting value
     * @returns {Promise<boolean>} - True if setting was updated successfully
     */
    static async update(discordServerId, settingKey, settingValue) {
        try {
            if (!discordServerId || !settingKey || !settingValue) {
                throw new Error('Missing required parameters: discordServerId, settingKey, and settingValue are required');
            }

            const response = await fetch(`${DiscordSettings._endpoint}/${discordServerId}`, {
                method: 'PUT',
                headers: DiscordSettings._headers,
                body: JSON.stringify({
                    setting_key: settingKey,
                    setting_value: settingValue
                })
            });

            const result = await response.json();
            return result.success === true;
        } catch (error) {
            console.error('Error updating Discord setting:', error.message);
            return false;
        }
    }

    /**
     * Delete a Discord setting
     * @param {string} discordServerId - Discord server ID
     * @param {string} settingKey - Setting key
     * @returns {Promise<boolean>} - True if setting was deleted successfully
     */
    static async delete(discordServerId, settingKey) {
        try {
            if (!discordServerId || !settingKey) {
                throw new Error('Missing required parameters: discordServerId and settingKey are required');
            }

            const response = await fetch(`${DiscordSettings._endpoint}/${discordServerId}`, {
                method: 'DELETE',
                headers: DiscordSettings._headers,
                body: JSON.stringify({
                    setting_key: settingKey
                })
            });

            const result = await response.json();
            return result.success === true;
        } catch (error) {
            console.error('Error deleting Discord setting:', error.message);
            return false;
        }
    }

    // =================================================================================================
    // Instance Methods
    // =================================================================================================

    /**
     * Load all settings for this Discord server
     * @param {boolean} forceReload - Force reload even if data is already loaded
     * @returns {Promise<boolean>} - True if settings were loaded successfully
     */
    async load(forceReload = false) {
        if (this.isLoaded && !forceReload) {
            return true;
        }

        if (!this.discordServerId) {
            throw new Error('Discord server ID is required to load settings');
        }

        // Check cache first
        if (!forceReload) {
            const cached = DiscordSettings._cache.get(this.discordServerId);
            if (cached) {
                this.settingsData = cached;
                this.isLoaded = true;
                return true;
            }
        }

        try {
            const settings = await DiscordSettings.getAll(this.discordServerId);
            if (settings) {
                this.settingsData = settings;
                this.isLoaded = true;
                this.cache.set(cacheKey, settings);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error loading Discord settings:', error.message);
            return false;
        }
    }

    /**
     * Get a setting value from loaded data
     * @param {string} settingKey - Setting key
     * @returns {string|null} - Setting value or null if not found
     */
    getSetting(settingKey) {
        if (!this.isLoaded) {
            throw new Error('Settings not loaded. Call load() first');
        }
        return this.settingsData[settingKey] || null;
    }

    /**
     * Get all loaded settings
     * @returns {Object} - All settings data
     */
    getAllSettings() {
        if (!this.isLoaded) {
            throw new Error('Settings not loaded. Call load() first');
        }
        return this.settingsData;
    }

    /**
     * Set a setting value in the instance and database
     * @param {string} settingKey - Setting key
     * @param {string} settingValue - Setting value
     * @returns {Promise<boolean>} - True if setting was set successfully
     */
    async setSetting(settingKey, settingValue) {
        if (!this.discordServerId) {
            throw new Error('Discord server ID is required');
        }

        try {
            // Check if setting exists, update or add accordingly
            const existingValue = await DiscordSettings.get(this.discordServerId, settingKey);
            let success;

            if (existingValue !== null) {
                success = await DiscordSettings.update(this.discordServerId, settingKey, settingValue);
            } else {
                success = await DiscordSettings.add(this.discordServerId, settingKey, settingValue);
            }

            if (success && this.isLoaded) {
                this.settingsData[settingKey] = settingValue;
                // Update cache
                Profile._cache.set(this.discordServerId, this.settingsData);
            }

            return success;
        } catch (error) {
            console.error('Error setting Discord setting:', error.message);
            return false;
        }
    }

    /**
     * Delete a setting from the instance and database
     * @param {string} settingKey - Setting key
     * @returns {Promise<boolean>} - True if setting was deleted successfully
     */
    async deleteSetting(settingKey) {
        if (!this.discordServerId) {
            throw new Error('Discord server ID is required');
        }

        try {
            const success = await DiscordSettings.delete(this.discordServerId, settingKey);
            
            if (success && this.isLoaded && this.settingsData[settingKey]) {
                delete this.settingsData[settingKey];
                // Update cache
                Profile._cache.set(this.discordServerId, this.settingsData);
            }

            return success;
        } catch (error) {
            console.error('Error deleting Discord setting:', error.message);
            return false;
        }
    }
}

// =================================================================================================
// Export Statement
// =================================================================================================

module.exports = DiscordSettings;
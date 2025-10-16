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
     * @param {boolean} forceReload - Force reload even if cached
     * @returns {Promise<Object|null>} - Object with all settings or null if none found
     */
    static async getAll(discordServerId, forceReload = false) {
        try {
            if (!discordServerId) {
                throw new Error('Missing required parameter: discordServerId is required');
            }

            // Check cache first
            const cached = DiscordSettings._cache.get(discordServerId);
            if (cached && !forceReload) {
                return cached;
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
            const data = result.data || {};

            // Cache the settings
            DiscordSettings._cache.set(discordServerId, data);

            return data;
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
            if (result.success === true) {
                // Clear cache
                DiscordSettings._cache.del(discordServerId);
            }

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
            if (result.success === true) {
                // Clear cache
                DiscordSettings._cache.del(discordServerId);
            }

            return result.success === true;
        } catch (error) {
            console.error('Error deleting Discord setting:', error.message);
            return false;
        }
    }

    /**
     * Register multiple settings for a Discord server (static method)
     * @param {string} discordServerId - Discord server ID
     * @param {Object} settingsObject - Object containing key-value pairs of settings to register
     * @param {Object} options - Registration options
     * @param {boolean} options.overwrite - Whether to overwrite existing settings (default: false)
     * @param {boolean} options.validateAll - Whether to validate all settings before registering any (default: true)
     * @returns {Promise<Object>} - Object containing success status and details about registered settings
     * @example
     * ```javascript
     * // Register multiple settings at once
     * const result = await DiscordSettings.registerSettings('123456789012345678', {
     *     'welcome_channel': '987654321098765432',
     *     'verification_role': '111222333444555666',
     *     'log_channel': '777888999000111222',
     *     'auto_role': '333444555666777888'
     * }, { overwrite: false, validateAll: true });
     * 
     * console.log(result);
     * // Output: { success: true, registered: 4, skipped: 0, updated: 0, errors: [] }
     * ```
     */
    static async registerSettings(discordServerId, settingsObject, options = {}) {
        try {
            if (!discordServerId) {
                throw new Error('Missing required parameter: discordServerId is required');
            }

            if (!settingsObject || typeof settingsObject !== 'object') {
                throw new Error('Missing required parameter: settingsObject must be a valid object');
            }

            const { overwrite = false, validateAll = true } = options;
            
            const results = {
                success: true,
                registered: 0,
                skipped: 0,
                updated: 0,
                errors: []
            };

            // Get existing settings for validation
            let existingSettings = {};
            if (validateAll || !overwrite) {
                existingSettings = await DiscordSettings.getAll(discordServerId) || {};
            }

            // Validate all settings first if validateAll is true
            if (validateAll) {
                for (const [settingKey, settingValue] of Object.entries(settingsObject)) {
                    if (!settingKey || settingValue === undefined || settingValue === null) {
                        results.errors.push(`Invalid setting: ${settingKey} - key and value are required`);
                    }
                }

                // If validation errors found and validateAll is true, return early
                if (results.errors.length > 0) {
                    results.success = false;
                    return results;
                }
            }

            // Process each setting
            for (const [settingKey, settingValue] of Object.entries(settingsObject)) {
                try {
                    if (!settingKey || settingValue === undefined || settingValue === null) {
                        if (!validateAll) {
                            results.errors.push(`Invalid setting: ${settingKey} - key and value are required`);
                        }
                        continue;
                    }

                    const settingExists = existingSettings.hasOwnProperty(settingKey);
                    
                    if (settingExists) {
                        if (overwrite) {
                            const updated = await DiscordSettings.update(discordServerId, settingKey, String(settingValue));
                            if (updated) {
                                results.updated++;
                            } else {
                                results.errors.push(`Failed to update setting: ${settingKey}`);
                            }
                        } else {
                            results.skipped++;
                        }
                    } else {
                        const added = await DiscordSettings.add(discordServerId, settingKey, String(settingValue));
                        if (added) {
                            results.registered++;
                        } else {
                            results.errors.push(`Failed to register setting: ${settingKey}`);
                        }
                    }
                } catch (error) {
                    results.errors.push(`Error processing ${settingKey}: ${error.message}`);
                }
            }

            // Set success to false if there were any errors
            results.success = results.errors.length === 0;

            return results;

        } catch (error) {
            console.error('Error registering Discord settings:', error.message);
            return {
                success: false,
                registered: 0,
                skipped: 0,
                updated: 0,
                errors: [`General error: ${error.message}`]
            };
        }
    }

    /**
     * Check if a Discord server exists in the database
     * @param {string} serverId - Discord server ID to verify
     * @returns {Promise<boolean>} - True if server exists, false otherwise
     * @example
     * ```javascript
     * // Check if a server exists
     * const exists = await DiscordSettings.serverExists('123456789012345678');
     * console.log(exists); // true or false
     * ```
     */
    static async exists(serverId) {
        try {
            if (!serverId) {
                throw new Error('Missing required parameter: serverId is required');
            }

            // Check cache first
            const cached = DiscordSettings._cache.get(serverId);
            if (cached) {
                return true;
            }

            const response = await fetch(`${DiscordSettings._endpoint}/${serverId}`, {
                method: 'GET',
                headers: DiscordSettings._headers
            });

            if (response.ok) {
                const result = await response.json();
                return result.success === true && result.data !== null;
            }

            return false;
        } catch (error) {
            console.error('Error checking if server exists:', error.message);
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
                DiscordSettings._cache.set(this.discordServerId, this.settingsData);
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
                DiscordSettings._cache.set(this.discordServerId, this.settingsData);
            }

            return success;
        } catch (error) {
            console.error('Error deleting Discord setting:', error.message);
            return false;
        }
    }

    /**
     * Register multiple new settings for the Discord server
     * @param {Object} settingsObject - Object containing key-value pairs of settings to register
     * @param {boolean} overwrite - Whether to overwrite existing settings (default: false)
     * @returns {Promise<Object>} - Object containing success status and details about registered settings
     * @example
     * ```javascript
     * const result = await discordSettings.registerSettings({
     *     'welcome_channel': '123456789',
     *     'verification_role': '987654321',
     *     'log_channel': '555666777'
     * }, false);
     * console.log(result); // { success: true, registered: 3, skipped: 0, errors: [] }
     * ```
     */
    async registerSettings(settingsObject, overwrite = false) {
        if (!this.discordServerId) {
            throw new Error('Discord server ID is required');
        }

        if (!settingsObject || typeof settingsObject !== 'object') {
            throw new Error('Settings object is required and must be an object');
        }

        const results = {
            success: true,
            registered: 0,
            skipped: 0,
            updated: 0,
            errors: []
        };

        try {
            // Ensure settings are loaded for checking existing values
            if (!this.isLoaded) {
                await this.load();
            }

            for (const [settingKey, settingValue] of Object.entries(settingsObject)) {
                try {
                    if (!settingKey || settingValue === undefined || settingValue === null) {
                        results.errors.push(`Invalid setting: ${settingKey} - key and value are required`);
                        continue;
                    }

                    const existingValue = this.getSetting(settingKey);
                    
                    if (existingValue !== null) {
                        if (overwrite) {
                            const updated = await this.setSetting(settingKey, String(settingValue));
                            if (updated) {
                                results.updated++;
                            } else {
                                results.errors.push(`Failed to update setting: ${settingKey}`);
                            }
                        } else {
                            results.skipped++;
                        }
                    } else {
                        const added = await this.setSetting(settingKey, String(settingValue));
                        if (added) {
                            results.registered++;
                        } else {
                            results.errors.push(`Failed to register setting: ${settingKey}`);
                        }
                    }
                } catch (error) {
                    results.errors.push(`Error processing ${settingKey}: ${error.message}`);
                }
            }

            // Set success to false if there were any errors
            results.success = results.errors.length === 0;

        } catch (error) {
            console.error('Error registering Discord settings:', error.message);
            results.success = false;
            results.errors.push(`General error: ${error.message}`);
        }

        return results;
    }

    /**
     * Register a single new setting with validation
     * @param {string} settingKey - Setting key
     * @param {string} settingValue - Setting value
     * @param {Object} options - Registration options
     * @param {boolean} options.overwrite - Whether to overwrite existing setting (default: false)
     * @param {Function} options.validator - Optional validation function for the value
     * @returns {Promise<Object>} - Object containing success status and operation details
     * @example
     * ```javascript
     * const result = await discordSettings.registerSetting('max_warnings', '3', {
     *     overwrite: true,
     *     validator: (value) => !isNaN(value) && parseInt(value) > 0
     * });
     * ```
     */
    async registerSetting(settingKey, settingValue, options = {}) {
        if (!this.discordServerId) {
            throw new Error('Discord server ID is required');
        }

        if (!settingKey || settingValue === undefined || settingValue === null) {
            throw new Error('Setting key and value are required');
        }

        const { overwrite = false, validator = null } = options;

        try {
            // Validate the value if validator is provided
            if (validator && typeof validator === 'function') {
                const isValid = validator(settingValue);
                if (!isValid) {
                    return {
                        success: false,
                        action: 'validation_failed',
                        message: `Validation failed for setting: ${settingKey}`
                    };
                }
            }

            // Ensure settings are loaded
            if (!this.isLoaded) {
                await this.load();
            }

            const existingValue = this.getSetting(settingKey);
            
            if (existingValue !== null && !overwrite) {
                return {
                    success: false,
                    action: 'skipped',
                    message: `Setting ${settingKey} already exists and overwrite is disabled`
                };
            }

            const success = await this.setSetting(settingKey, String(settingValue));
            
            if (success) {
                return {
                    success: true,
                    action: existingValue !== null ? 'updated' : 'created',
                    message: `Setting ${settingKey} ${existingValue !== null ? 'updated' : 'registered'} successfully`
                };
            } else {
                return {
                    success: false,
                    action: 'failed',
                    message: `Failed to register setting: ${settingKey}`
                };
            }

        } catch (error) {
            console.error('Error registering Discord setting:', error.message);
            return {
                success: false,
                action: 'error',
                message: error.message
            };
        }
    }
}

// =================================================================================================
// Export Statement
// =================================================================================================

module.exports = DiscordSettings;
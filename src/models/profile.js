/**
 * @file        models/model-profile.js
 * @author      vicentefelipechile
 * @description Profile model class with CRUD operations and user management functionality
 */

// =================================================================================================
// Import Statements
// =================================================================================================

const { D1_URL, D1_PRIVATE_KEY } = require('../env');
const { VRCHAT_CLIENT } = require('../vrchat');
const NodeCache = require('node-cache');

// =================================================================================================
// Profile Model Class
// =================================================================================================

/**
 * Profile model representing a user profile with CRUD operations
 * @class Profile
 * @example
 * ## Factory Method Usage
 * ```javascript
 * // Get a profile using their ID with their data using the factory method
 * const profile = await Profile.create('usr_123456');
 * ```
 * ## Empty Instance Usage
 * ```javascript
 * // Create a new user with only their discordId and vrchatId, fetching their VRChat name automatically
 * const newProfile = Profile.createUserWithAutoName('usr_12345-abcd-1234-efgh-567890123456', '123456789012345678');
 */
class Profile {
    constructor(profileId = null, profileData = null) {
        this.profileId = profileId;
        this.profileData = profileData;
        this.vrchatData = null; // Store VRChat API data
        this._isLoaded = profileData !== null;
        this._vrchatDataLoaded = false;
        
        // Detect and store ID type for optimization
        if (profileId) {
            this.idType = Profile.getIdType(profileId);
            this.isVRChatProfile = Profile.isVRChatId(profileId);
            this.isDiscordProfile = Profile.isDiscordId(profileId);
        }
        
        // Private static properties for shared functionality
        if (!Profile._cache) {
            Profile._cache = new NodeCache({ stdTTL: 60 * 60 }); // Cache for 1 hour
        }
        
        // Cache for VRChat data (shorter TTL since it changes more frequently)
        if (!Profile._vrchatCache) {
            Profile._vrchatCache = new NodeCache({ stdTTL: 10 * 60 }); // Cache for 10 minutes
        }
        
        if (!Profile._endpoint) {
            Profile._endpoint = D1_URL;
        }
        
        if (!Profile._headers) {
            Profile._headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${D1_PRIVATE_KEY}`,
            };
        }
    }

    /**
     * Factory method to create a Profile instance with auto-loaded data
     * @param {string} profileId - The profile ID to load (Discord ID or VRChat ID starting with "usr_")
     * @param {boolean} allowPartialLoad - Allow loading VRChat data even if user doesn't exist in database
     * @returns {Promise<Profile>} - Profile instance with loaded data (may be partial if user doesn't exist)
     */
    static async create(profileId, allowPartialLoad = true) {
        const profile = new Profile(profileId);
        await profile.load(false, allowPartialLoad);
        return profile;
    }

    /**
     * Factory method to create a Profile instance without auto-loading
     * @param {string} profileId - The profile ID (Discord ID or VRChat ID starting with "usr_")
     * @returns {Profile} - Profile instance without loaded data
     */
    static createEmpty(profileId = null) {
        return new Profile(profileId);
    }

    // =================================================================================================
    // ID Detection Methods
    // =================================================================================================

    /**
     * Detect if an ID is a VRChat ID (starts with "usr_")
     * @param {string} id - The ID to check
     * @returns {boolean} - True if it's a VRChat ID
     */
    static isVRChatId(id) {
        return typeof id === 'string' && id.startsWith('usr_');
    }

    /**
     * Detect if an ID is a Discord ID (numeric string, not starting with "usr_")
     * @param {string} id - The ID to check
     * @returns {boolean} - True if it's a Discord ID
     */
    static isDiscordId(id) {
        return typeof id === 'string' && !id.startsWith('usr_');
    }

    /**
     * Get the appropriate search parameter name for the ID type
     * @param {string} id - The ID to check
     * @returns {string} - Either 'vrchat_id' or 'discord_id'
     */
    static getIdType(id) {
        return Profile.isVRChatId(id) ? 'vrchat_id' : 'discord_id';
    }

    // =================================================================================================
    // CRUD Operations
    // =================================================================================================

    /**
     * Add a new profile to the database
     * @param {Object} profileData - Profile data containing vrchat_id, discord_id, vrchat_name
     * @returns {Promise<boolean>} - True if profile was created successfully
     */
    static async add(profileData) {
        try {
            // Basic validation
            if (!profileData.vrchat_id || !profileData.discord_id) {
                throw new Error('Missing required fields: vrchat_id and discord_id are required');
            }

            // Variable extraction
            const {
                vrchat_id: vrchatId,
                discord_id: discordId,
            } = profileData;

            const vrchatName = profileData.vrchat_name || 'Unknown User';

            // API call to create profile
            const response = await fetch(Profile._endpoint, {
                method: 'POST',
                headers: Profile._headers,
                body: JSON.stringify({
                    vrchat_id: vrchatId,
                    discord_id: discordId,
                    vrchat_name: vrchatName,
                }),
            });

            return response.status === 201;
        } catch (e) {
            console.error(`Error adding profile: ${e.message}`);
            throw e;
        }
    }

    /**
     * Create a new user profile with individual parameters
     * @param {string} vrchatId - VRChat ID (must start with "usr_")
     * @param {string} discordId - Discord ID 
     * @param {string} vrchatName - VRChat display name
     * @returns {Promise<Profile>} - New Profile instance with the created user data
     */
    static async createUser(vrchatId, discordId, vrchatName) {
        try {
            // Validation
            if (!vrchatId || !discordId || !vrchatName) {
                throw new Error('Missing required parameters: vrchatId, discordId, and vrchatName are all required');
            }

            if (!Profile.isVRChatId(vrchatId)) {
                throw new Error('Invalid VRChat ID: must start with "usr_"');
            }

            // Create profile using the add method
            const success = await Profile.add({
                vrchat_id: vrchatId,
                discord_id: discordId,
                vrchat_name: vrchatName
            });

            if (!success) {
                throw new Error('Failed to create user profile');
            }

            // Return a new Profile instance loaded with the created data
            return await Profile.create(discordId);
        } catch (e) {
            console.error(`Error creating user: ${e.message}`);
            throw e;
        }
    }

    /**
     * Create a new user and return instance without auto-loading data
     * @param {string} vrchatId - VRChat ID (must start with "usr_")
     * @param {string} discordId - Discord ID 
     * @param {string} vrchatName - VRChat display name
     * @returns {Promise<boolean>} - True if user was created successfully
     */
    static async createUserSimple(vrchatId, discordId, vrchatName) {
        try {
            // Validation
            if (!vrchatId || !discordId || !vrchatName) {
                throw new Error('Missing required parameters: vrchatId, discordId, and vrchatName are all required');
            }

            if (!Profile.isVRChatId(vrchatId)) {
                throw new Error('Invalid VRChat ID: must start with "usr_"');
            }

            // Create profile
            return await Profile.add({
                vrchat_id: vrchatId,
                discord_id: discordId,
                vrchat_name: vrchatName
            });
        } catch (e) {
            console.error(`Error creating user: ${e.message}`);
            throw e;
        }
    }

    /**
     * Create a new user with automatic VRChat name fetching from API
     * @param {string} vrchatId - VRChat ID (must start with "usr_")
     * @param {string} discordId - Discord ID
     * @returns {Promise<Profile>} - New Profile instance with fetched VRChat name
     */
    static async createUserWithAutoName(vrchatId, discordId) {
        try {
            // Validation
            if (!vrchatId || !discordId) {
                throw new Error('Missing required parameters: vrchatId and discordId are required');
            }

            if (!Profile.isVRChatId(vrchatId)) {
                throw new Error('Invalid VRChat ID: must start with "usr_"');
            }

            // Fetch VRChat name from API
            const vrchatResponse = await VRCHAT_CLIENT.getUser({
                path: { userId: vrchatId }
            });
            
            if (vrchatResponse.response.status !== 200) {
                throw new Error(`Failed to fetch VRChat user data: ${vrchatResponse.response.status}`);
            }

            const vrchatName = vrchatResponse.data.displayName;

            // Create user with fetched name
            return await Profile.createUser(vrchatId, discordId, vrchatName);
        } catch (e) {
            console.error(`Error creating user with auto name: ${e.message}`);
            throw e;
        }
    }

    /**
     * Create a new user with temporary name, can be updated later
     * @param {string} vrchatId - VRChat ID (must start with "usr_")
     * @param {string} discordId - Discord ID
     * @param {string} tempName - Temporary name (optional, defaults to "Unknown User")
     * @returns {Promise<Profile>} - New Profile instance that can be updated later
     */
    static async createUserWithTempName(vrchatId, discordId, tempName = 'Unknown User') {
        try {
            // Validation
            if (!vrchatId || !discordId) {
                throw new Error('Missing required parameters: vrchatId and discordId are required');
            }

            if (!Profile.isVRChatId(vrchatId)) {
                throw new Error('Invalid VRChat ID: must start with "usr_"');
            }

            // Create user with temporary name
            return await Profile.createUser(vrchatId, discordId, tempName);
        } catch (e) {
            console.error(`Error creating user with temp name: ${e.message}`);
            throw e;
        }
    }

    /**
     * Get profile data by ID (VRChat ID starting with "usr_" or Discord ID)
     * @param {string} profileId - The ID of the profile to fetch
     * @returns {Promise<Object|null>} - The profile data or null if not found
     */
    static async get(profileId) {
        try {
            // Check cache first
            if (Profile._cache.has(profileId)) {
                return Profile._cache.get(profileId);
            }

            const response = await fetch(`${Profile._endpoint}/${profileId}`, {
                method: 'GET',
                headers: Profile._headers,
            });

            const data = await response.json();
            if (response.status !== 200) {
                return { success: false, data: null };
            }

            // Cache the result
            Profile._cache.set(profileId, data);

            return data;
        } catch (e) {
            console.error(`Error fetching profile: ${e.message}`);
            return { success: false, data: null };
        }
    }

    /**
     * Update an existing profile
     * @param {string} profileId - The ID of the profile to update
     * @param {Object} updateData - Data to update
     * @returns {Promise<boolean>} - True if profile was updated successfully
     */
    static async update(profileId, updateData) {
        try {
            // Basic validation
            if (!updateData || Object.keys(updateData).length === 0) {
                throw new Error('No fields provided to update');
            }

            const response = await fetch(`${Profile._endpoint}/${profileId}`, {
                method: 'PUT',
                headers: Profile._headers,
                body: JSON.stringify(updateData),
            });

            if (response.status === 200) {
                Profile._cache.del(profileId);
                return true;
            }
            return false;
        } catch (e) {
            console.error(`Error updating profile: ${e.message}`);
            throw e;
        }
    }

    /**
     * Delete a profile by ID
     * @param {string} profileId - The ID of the profile to delete
     * @returns {Promise<boolean>} - True if profile was deleted successfully
     */
    static async delete(profileId) {
        try {
            const response = await fetch(`${Profile._endpoint}/${profileId}`, {
                method: 'DELETE',
                headers: Profile._headers,
            });

            if (response.status === 200) {
                // Clear cache for this profile
                Profile._cache.del(profileId);
                return true;
            }
            return false;
        } catch (e) {
            console.error(`Error deleting profile: ${e.message}`);
            return false;
        }
    }

    // =================================================================================================
    // Instance Methods
    // =================================================================================================

    /**
     * Load profile data for this instance
     * @param {boolean} forceReload - Force reload even if data is already loaded
     * @param {boolean} allowPartialLoad - Allow loading VRChat data even if user doesn't exist in database
     * @returns {Promise<boolean>} - True if profile data was loaded successfully
     */
    async load(forceReload = false, allowPartialLoad = true) {
        if (!this.profileId) {
            throw new Error('Profile ID is required to load profile data');
        }

        // Skip loading if data is already loaded and not forcing reload
        if (this._isLoaded && !forceReload) {
            // Still try to load VRChat data if requested and not loaded
            if (!this._vrchatDataLoaded) {
                await this.loadVRChatData();
            }
            return true;
        }

        const result = await Profile.get(this.profileId);
        if (result.success && result.data) {
            this.profileData = result.data;
            this._isLoaded = true;
            
            // Automatically load VRChat data if requested
            await this.loadVRChatData();
            
            return true;
        }
        
        if (allowPartialLoad && this.isVRChatProfile) {
            const vrchatData = await Profile.getVRChatData(this.profileId);
            if (vrchatData) {
                this.vrchatData = vrchatData;
                this._vrchatDataLoaded = true;

                return true;
            }
            return false;
        }
        return false;
    }

    /**
     * Load VRChat data for this profile
     * @param {boolean} forceReload - Force reload even if data is already loaded
     * @returns {Promise<boolean>} - True if VRChat data was loaded successfully
     */
    async loadVRChatData(forceReload = false) {
        if (!this.profileData || !this.profileData.vrchat_id) {
            // Can't load VRChat data without VRChat ID
            return false;
        }

        const vrchatId = this.profileData.vrchat_id;

        // Check cache first (unless forcing reload)
        if (!forceReload && Profile._vrchatCache.has(vrchatId)) {
            this.vrchatData = Profile._vrchatCache.get(vrchatId);
            this._vrchatDataLoaded = true;
            return true;
        }

        try {
            const data = await Profile.getVRChatData(vrchatId);
            if (data) {
                this.vrchatData = data;
                this._vrchatDataLoaded = true;
                
                // Cache the VRChat data
                Profile._vrchatCache.set(vrchatId, data);
                
                return true;
            }
        } catch (e) {
            console.error(`Error loading VRChat data for ${vrchatId}: ${e.message}`);
        }
        
        return false;
    }

    /**
     * Check if profile data is loaded
     * @returns {boolean} - True if profile data is loaded
     */
    isLoaded() {
        return this._isLoaded && this.profileData !== null;
    }

    /**
     * Ensure profile data is loaded before proceeding
     * @returns {Promise<boolean>} - True if data is available
     */
    async ensureLoaded() {
        if (!this.isLoaded()) {
            return await this.load();
        }
        return true;
    }

    /**
     * Save current profile data
     * @returns {Promise<boolean>} - True if profile was saved successfully
     */
    async save() {
        if (!this.profileData) {
            throw new Error('No profile data to save');
        }

        if (this.profileId) {
            return await Profile.update(this.profileId, this.profileData);
        } else {
            return await Profile.add(this.profileData);
        }
    }

    /**
     * Delete this profile
     * @returns {Promise<boolean>} - True if profile was deleted successfully
     */
    async remove() {
        if (!this.profileId) {
            throw new Error('Profile ID is required to delete profile');
        }

        const result = await Profile.delete(this.profileId);
        if (result) {
            this.profileData = null;
        }
        return result;
    }

    // =================================================================================================
    // User Status Methods
    // =================================================================================================

    /**
     * Check if user exists
     * @returns {Promise<boolean>} - True if user exists
     */
    async exists() {
        const result = await Profile.get(this.profileId);
        return result.success === true && result.data !== null;
    }

    /**
     * Check if user is banned
     * @returns {Promise<boolean>} - True if user is banned
     */
    async isBanned() {
        await this.ensureLoaded();
        return this.profileData && this.profileData.is_banned === true;
    }

    /**
     * Check if user is verified
     * @returns {Promise<boolean>} - True if user is verified
     */
    async isVerified() {
        return this.profileData !== null;
    }

    /**
     * Check if user is verified as 18+
     * @returns {Promise<boolean>} - True if user is verified as 18+
     */
    async isVerified18Plus() {
        await this.ensureLoaded();
        return (
            this.profileData &&
            this.profileData.is_verified === true &&
            this.profileData.verified_at !== null
        );
    }

    // =================================================================================================
    // User Actions
    // =================================================================================================

    /**
     * Verify user
     * @param {string} vrchatId - VRChat ID
     * @param {string} vrchatName - VRChat name
     * @returns {Promise<boolean>} - True if user was verified successfully
     */
    async verify() {
        const isVerified = await this.isVerified();
        if (isVerified) throw new Error('User is already verified');

        const isBanned = await this.isBanned();
        if (isBanned) throw new Error('User is banned');

        const vrchatId = this.isVRChatProfile ? this.profileId : await this.getVRChatId();
        if (!vrchatId) {
            throw new Error('VRChat ID is required to verify user');
        }

        const discordId = this.isDiscordProfile ? this.profileId : await this.getDiscordId();
        if (!discordId) {
            throw new Error('Discord ID is required to verify user');
        }

        let vrchatName;
        if (this.isVRChatProfile) {
            vrchatName = this.vrchatData ? this.vrchatData.displayName : null;
        }

        return await Profile.add({
            vrchat_id: vrchatId,
            discord_id: discordId,
            vrchat_name: vrchatName || 'Unknown User',
        });
    }

    /**
     * Verify user as 18+
     * @returns {Promise<boolean>} - True if user was verified as 18+ successfully
     */
    async verify18Plus() {
        const data = await Profile.get(this.profileId);
        if (data.success !== true || data.data === null) {
            throw new Error('Failed to fetch user data');
        }

        return await Profile.update(this.profileId, { is_verified: true });
    }

    /**
     * Unverify user
     * @returns {Promise<boolean>} - True if user was unverified successfully
     */
    async unverify() {
        const data = await Profile.get(this.profileId);
        if (data.success !== true || data.data === null) {
            throw new Error('Failed to fetch user data');
        }

        return await Profile.delete(this.profileId);
    }

    /**
     * Unverify user as 18+
     * @returns {Promise<boolean>} - True if user was unverified as 18+ successfully
     */
    async unverify18Plus() {
        const data = await Profile.get(this.profileId);
        if (data.success !== true || data.data === null) {
            throw new Error('Failed to fetch user data');
        }

        return await Profile.update(this.profileId, { is_verified: false });
    }

    /**
     * Update VRChat name from VRChat API
     * @param {boolean} forceRefresh - Force refresh of profile data after update
     * @returns {Promise<string|null>} - Updated VRChat name if successful, null otherwise
     */
    async updateName(forceRefresh = true) {
        await this.ensureLoaded();
        
        if (!this.profileData || !this.profileData.vrchat_id) {
            throw new Error('User data not found or missing VRChat ID');
        }

        try {
            const response = await VRCHAT_CLIENT.getUser({
                path: { userId: this.profileData.vrchat_id }
            });

            if (response.response.status === 200) {
                const vrchatName = response.data.displayName;
                const result = await Profile.update(this.profileId, {
                    vrchat_name: vrchatName,
                });

                if (result) {
                    // Update local data if available
                    if (this.profileData) {
                        this.profileData.vrchat_name = vrchatName;
                    }
                    
                    // Optionally refresh all profile data
                    if (forceRefresh) {
                        await this.load(true);
                    }
                    
                    return vrchatName;
                }
            }

            return null;
        } catch (e) {
            console.error(`Error updating name for ${this.profileId}: ${e.message}`);
            return null;
        }
    }

    /**
     * Update VRChat name using a custom name (not from API)
     * @param {string} newName - New VRChat name to set
     * @returns {Promise<boolean>} - True if name was updated successfully
     */
    async setVRChatName(newName) {
        if (!newName || typeof newName !== 'string') {
            throw new Error('Valid name is required');
        }

        try {
            const result = await Profile.update(this.profileId, {
                vrchat_name: newName,
            });

            if (result) {
                // Update local data if available
                if (this.profileData) {
                    this.profileData.vrchat_name = newName;
                }
                
                return true;
            }
            return false;
        } catch (e) {
            console.error(`Error setting VRChat name for ${this.profileId}: ${e.message}`);
            return false;
        }
    }

    // =================================================================================================
    // Static Utility Methods
    // =================================================================================================

    /**
     * Generate verification code from VRChat ID
     * @param {string} vrchatId - VRChat ID
     * @returns {string} - Generated verification code
     */
    static generateCodeByVRChat(vrchatId) {
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
    static getVRChatId(vrchatId) {
        const RegexURL = new RegExp(/^(?:https?:\/\/)?(?:www\.)?vrchat\.com\/home\/user\/(usr_[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12})$/);
        const RegexID = new RegExp(/^(usr_[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12})$/);

        const match = vrchatId.match(RegexURL);
        if (match && match[1]) return match[1];
        if (RegexID.test(vrchatId)) return vrchatId;
        return null;
    }

    /**
     * Get user by Discord ID
     * @param {string} discordId - Discord ID
     * @returns {Promise<Object|null>} - User data or null
     */
    static async getUserByDiscord(discordId) {
        const result = await Profile.get(discordId);
        return result.success ? result.data : null;
    }

    /**
     * Get user by VRChat ID
     * @param {string} vrchatId - VRChat ID
     * @returns {Promise<Object|null>} - User data or null
     */
    static async getUserByVRChat(vrchatId) {
        return await Profile.getUserByDiscord(vrchatId);
    }

    /**
     * Get VRChat profile data directly from VRChat API
     * @param {string} vrchatId - VRChat ID (must start with "usr_")
     * @returns {Promise<Object|null>} - VRChat profile data or null if not found/error
     */
    static async getVRChatData(vrchatId, saveInCache = true) {
        try {
            if (!Profile.isVRChatId(vrchatId)) {
                const vrchatIdExtracted = Profile.getVRChatId(vrchatId);
                if (!vrchatIdExtracted) {
                    throw new Error('VRChat ID not found or invalid format');
                }
                vrchatId = vrchatIdExtracted;
            }

            const response = await VRCHAT_CLIENT.getUser({
                path: { userId: vrchatId }
            });

            if (response.response.status === 200) {
                if (saveInCache) {
                    Profile._vrchatCache.set(vrchatId, response.data);
                }

                return response.data;
            } else {
                console.error(`VRChat API error: ${response.response.status}`);
                return null;
            }
        } catch (e) {
            console.error(`Error fetching VRChat profile data: ${e.message}`);
            return null;
        }
    }

    // =================================================================================================
    // Getters and Setters
    // =================================================================================================

    getProfileId() {
        return this.profileId;
    }

    setProfileId(profileId) {
        this.profileId = profileId;
        this.profileData = null; // Clear cached data when ID changes
        this.vrchatData = null; // Clear VRChat data when ID changes
        this._isLoaded = false;
        this._vrchatDataLoaded = false;
        
        // Update ID type detection
        if (profileId) {
            this.idType = Profile.getIdType(profileId);
            this.isVRChatProfile = Profile.isVRChatId(profileId);
            this.isDiscordProfile = Profile.isDiscordId(profileId);
        } else {
            this.idType = null;
            this.isVRChatProfile = false;
            this.isDiscordProfile = false;
        }
    }

    getProfileData() {
        return this.profileData;
    }

    /**
     * Get VRChat data from instance
     * @returns {Object|null} - VRChat data or null if not loaded
     */
    getVRChatData() {
        return this.vrchatData;
    }

    /**
     * Set VRChat data for this instance
     * @param {Object} data - VRChat data to set
     */
    setVRChatData(data) {
        this.vrchatData = data;
        this._vrchatDataLoaded = data !== null;
    }

    /**
     * Check if VRChat data is loaded
     * @returns {boolean} - True if VRChat data is loaded
     */
    isVRChatDataLoaded() {
        return this._vrchatDataLoaded && this.vrchatData !== null;
    }

    /**
     * Check if user is registered in the database
     * @returns {boolean} - True if user exists in database
     */
    isRegistered() {
        return this._isLoaded && this.profileData !== null;
    }

    /**
     * Check if this is a partial profile (VRChat data only, not in database)
     * @returns {boolean} - True if only VRChat data is available
     */
    isPartialProfile() {
        return !this.isRegistered() && this.isVRChatDataLoaded();
    }

    /**
     * Get specific field from profile data
     * @param {string} field - Field name to get
     * @returns {any} - Field value or null if not found
     */
    async getField(field) {
        await this.ensureLoaded();
        return this.profileData ? this.profileData[field] : null;
    }

    /**
     * Get VRChat ID from loaded profile data
     * @returns {Promise<string|null>} - VRChat ID or null
     */
    async getVRChatId() {
        return await this.getField('vrchat_id');
    }

    /**
     * Get VRChat ID code confirmation
     * @returns {Promise<string|null>} - VRChat ID code or empty string if not available
     */
    async getVRChatCodeConfirmation() {
        const vrchatId = await this.getVRChatId();
        if (!vrchatId) return null;

        return Profile.generateCodeByVRChat(vrchatId);
    }

    /**
     * Get Discord ID from loaded profile data
     * @returns {Promise<string|null>} - Discord ID or null
     */
    async getDiscordId() {
        return await this.getField('discord_id');
    }

    /**
     * Get VRChat name from loaded profile data
     * @returns {Promise<string|null>} - VRChat name or null
     */
    async getVRChatName() {
        return await this.getField('vrchat_name');
    }

    /**
     * Get the opposite ID (if profileId is Discord, returns VRChat ID and vice versa)
     * @returns {Promise<string|null>} - The opposite ID or null
     */
    async getOppositeId() {
        await this.ensureLoaded();
        if (!this.profileData) return null;
        
        if (this.isVRChatProfile) {
            return this.profileData.discord_id;
        } else {
            return this.profileData.vrchat_id;
        }
    }

    /**
     * Get ID type information
     * @returns {Object} - Object with ID type information
     */
    getIdTypeInfo() {
        return {
            profileId: this.profileId,
            idType: this.idType,
            isVRChatProfile: this.isVRChatProfile,
            isDiscordProfile: this.isDiscordProfile
        };
    }
}

module.exports = Profile;
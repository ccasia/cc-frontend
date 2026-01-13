import axios from 'axios';

/**
 * Create a manual creator entry for a campaign
 * @param {string} campaignId - Campaign ID
 * @param {object} data - Entry data
 * @returns {Promise<object>} Created entry
 */
export const createManualCreatorEntry = async (campaignId, data) => {
  const response = await axios.post(`/api/campaign/${campaignId}/manual-creator`, data);
  return response.data;
};

/**
 * Update a manual creator entry
 * @param {string} campaignId - Campaign ID
 * @param {string} entryId - Entry ID
 * @param {object} data - Updated data
 * @returns {Promise<object>} Updated entry
 */
export const updateManualCreatorEntry = async (campaignId, entryId, data) => {
  const response = await axios.put(`/api/campaign/${campaignId}/manual-creator/${entryId}`, data);
  return response.data;
};

/**
 * Delete a manual creator entry
 * @param {string} campaignId - Campaign ID
 * @param {string} entryId - Entry ID
 * @returns {Promise<object>} Response
 */
export const deleteManualCreatorEntry = async (campaignId, entryId) => {
  const response = await axios.delete(`/api/campaign/${campaignId}/manual-creator/${entryId}`);
  return response.data;
};

/**
 * Detect platform from URL
 * @param {string} url - Social media URL
 * @returns {string|null} Platform name or null
 */
export const detectPlatformFromUrl = (url) => {
  if (!url) return null;

  const lowercaseUrl = url.toLowerCase();

  if (lowercaseUrl.includes('instagram.com') || lowercaseUrl.includes('instagr.am')) {
    return 'Instagram';
  }

  if (lowercaseUrl.includes('tiktok.com') || lowercaseUrl.includes('vm.tiktok.com')) {
    return 'TikTok';
  }

  return null;
};

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @param {string} expectedPlatform - Optional expected platform ('Instagram' or 'TikTok')
 * @returns {object} Validation result
 */
export const validateUrl = (url, expectedPlatform = null) => {
  if (!url) {
    return { isValid: true }; // URL is optional
  }

  try {
    // eslint-disable-next-line no-new
    new URL(url);
    const platform = detectPlatformFromUrl(url);

    if (!platform) {
      return {
        isValid: false,
        reason: 'URL must be from Instagram or TikTok',
      };
    }

    // If an expected platform is provided, validate that the URL matches it
    if (expectedPlatform && platform !== expectedPlatform) {
      return {
        isValid: false,
        reason: `URL must be from ${expectedPlatform}. Current URL is from ${platform}.`,
      };
    }

    return { isValid: true };
  } catch {
    return {
      isValid: false,
      reason: 'Invalid URL format',
    };
  }
};

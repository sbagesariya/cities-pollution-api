const axios = require('axios');
const cache = require('../utils/cache');
const logger = require('../utils/logger');

const WIKIPEDIA_API_BASE_URL = 'https://en.wikipedia.org/api/rest_v1';

/**
 * Service for interacting with Wikipedia API
 */
class WikipediaService {
  constructor() {
    this.client = axios.create({
      baseURL: WIKIPEDIA_API_BASE_URL,
      timeout: 10000, // 10 second timeout
      headers: {
        'User-Agent': 'Cities-Pollution-API/1.0.0 (https://example.com/contact)'
      }
    });

    // Add rate limiting protection
    this.requestQueue = [];
    this.isProcessing = false;
    this.minRequestInterval = 100; // Minimum 100ms between requests
  }

  /**
   * Gets a short description for a city from Wikipedia
   * @param {string} cityName - Name of the city
   * @param {string} countryName - Name of the country
   * @returns {Promise<string|null>} City description or null if not found
   */
  async getCityDescription(cityName, countryName) {
    const cacheKey = `wiki_${cityName}_${countryName}`.toLowerCase();
    
    // Check cache first (cache for 24 hours)
    const cachedDescription = cache.get(cacheKey);
    if (cachedDescription) {
      logger.debug(`Cache hit for Wikipedia description: ${cityName}`);
      return cachedDescription;
    }

    try {
      // Try different search terms
      const searchTerms = [
        cityName,
        `${cityName}, ${countryName}`,
        `${cityName} ${countryName}`
      ];

      for (const searchTerm of searchTerms) {
        try {
          const description = await this._fetchDescriptionByTitle(searchTerm);
          if (description) {
            // Cache successful results for 24 hours
            cache.set(cacheKey, description, 24 * 60 * 60 * 1000);
            logger.debug(`Got Wikipedia description for: ${cityName}`);
            return description;
          }
        } catch (error) {
          logger.debug(`Failed to get description with term "${searchTerm}": ${error.message}`);
          continue;
        }
      }

      // If no description found, cache null result for 1 hour to avoid repeated requests
      cache.set(cacheKey, null, 60 * 60 * 1000);
      logger.debug(`No Wikipedia description found for: ${cityName}`);
      return null;

    } catch (error) {
      logger.warn(`Error getting Wikipedia description for ${cityName}: ${error.message}`);
      return null;
    }
  }

  /**
   * Fetches description by Wikipedia title
   * @private
   */
  async _fetchDescriptionByTitle(title) {
    // Add request to queue to implement rate limiting
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ title, resolve, reject });
      this._processQueue();
    });
  }

  /**
   * Processes the request queue with rate limiting
   * @private
   */
  async _processQueue() {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.requestQueue.length > 0) {
      const { title, resolve, reject } = this.requestQueue.shift();

      try {
        const encodedTitle = encodeURIComponent(title);
        const response = await this.client.get(`/page/summary/${encodedTitle}`);
        
        if (response.data && response.data.extract) {
          // Clean up the extract (remove extra whitespace, limit length)
          let extract = response.data.extract.trim();
          if (extract.length > 300) {
            extract = extract.substring(0, 300).trim();
            // Try to end at a sentence boundary
            const lastPeriod = extract.lastIndexOf('.');
            if (lastPeriod > 200) {
              extract = extract.substring(0, lastPeriod + 1);
            } else {
              extract += '...';
            }
          }
          resolve(extract);
        } else {
          resolve(null);
        }
      } catch (error) {
        if (error.response?.status === 404) {
          resolve(null); // Not found is acceptable
        } else {
          reject(error);
        }
      }

      // Wait before processing next request
      await this._delay(this.minRequestInterval);
    }

    this.isProcessing = false;
  }

  /**
   * Utility function to add delay
   * @private
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new WikipediaService();
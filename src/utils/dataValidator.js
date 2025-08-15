const logger = require('./logger');

/**
 * Utility class for validating and filtering city data
 */
class DataValidator {
  constructor() {
    // Common patterns that indicate non-city entries
    this.invalidPatterns = [
      /^[0-9]+$/,                    // Pure numbers
      /^[^a-zA-Z]*$/,                // No letters
      /^\s*$/,                       // Empty or whitespace only
      /^(test|sample|dummy|fake)$/i, // Test data indicators
      /^(n\/a|null|undefined)$/i,    // Null indicators
      /^[<>{}[\]()]+$/,              // Special characters only
      /(region|province|state|county|district)$/i // Administrative divisions
    ];

    // Words that commonly appear in non-city entries
    this.suspiciousWords = [
      'ocean', 'sea', 'river', 'lake', 'mountain', 'desert', 'forest',
      'airport', 'station', 'port', 'base', 'facility',
      'region', 'area', 'zone', 'sector', 'district'
    ];

    // Valid country names or codes (simplified list - could be expanded)
    this.validCountryCodes = new Set([
      'AD', 'AE', 'AF', 'AG', 'AI', 'AL', 'AM', 'AO', 'AQ', 'AR', 'AS', 'AT',
      'AU', 'AW', 'AX', 'AZ', 'BA', 'BB', 'BD', 'BE', 'BF', 'BG', 'BH', 'BI',
      'BJ', 'BL', 'BM', 'BN', 'BO', 'BQ', 'BR', 'BS', 'BT', 'BV', 'BW', 'BY',
      'BZ', 'CA', 'CC', 'CD', 'CF', 'CG', 'CH', 'CI', 'CK', 'CL', 'CM', 'CN',
      'CO', 'CR', 'CU', 'CV', 'CW', 'CX', 'CY', 'CZ', 'DE', 'DJ', 'DK', 'DM',
      'DO', 'DZ', 'EC', 'EE', 'EG', 'EH', 'ER', 'ES', 'ET', 'FI', 'FJ', 'FK',
      'FM', 'FO', 'FR', 'GA', 'GB', 'GD', 'GE', 'GF', 'GG', 'GH', 'GI', 'GL',
      'GM', 'GN', 'GP', 'GQ', 'GR', 'GS', 'GT', 'GU', 'GW', 'GY', 'HK', 'HM',
      'HN', 'HR', 'HT', 'HU', 'ID', 'IE', 'IL', 'IM', 'IN', 'IO', 'IQ', 'IR',
      'IS', 'IT', 'JE', 'JM', 'JO', 'JP', 'KE', 'KG', 'KH', 'KI', 'KM', 'KN',
      'KP', 'KR', 'KW', 'KY', 'KZ', 'LA', 'LB', 'LC', 'LI', 'LK', 'LR', 'LS',
      'LT', 'LU', 'LV', 'LY', 'MA', 'MC', 'MD', 'ME', 'MF', 'MG', 'MH', 'MK',
      'ML', 'MM', 'MN', 'MO', 'MP', 'MQ', 'MR', 'MS', 'MT', 'MU', 'MV', 'MW',
      'MX', 'MY', 'MZ', 'NA', 'NC', 'NE', 'NF', 'NG', 'NI', 'NL', 'NO', 'NP',
      'NR', 'NU', 'NZ', 'OM', 'PA', 'PE', 'PF', 'PG', 'PH', 'PK', 'PL', 'PM',
      'PN', 'PR', 'PS', 'PT', 'PW', 'PY', 'QA', 'RE', 'RO', 'RS', 'RU', 'RW',
      'SA', 'SB', 'SC', 'SD', 'SE', 'SG', 'SH', 'SI', 'SJ', 'SK', 'SL', 'SM',
      'SN', 'SO', 'SR', 'SS', 'ST', 'SV', 'SX', 'SY', 'SZ', 'TC', 'TD', 'TF',
      'TG', 'TH', 'TJ', 'TK', 'TL', 'TM', 'TN', 'TO', 'TR', 'TT', 'TV', 'TW',
      'TZ', 'UA', 'UG', 'UM', 'US', 'UY', 'UZ', 'VA', 'VC', 'VE', 'VG', 'VI',
      'VN', 'VU', 'WF', 'WS', 'YE', 'YT', 'ZA', 'ZM', 'ZW'
    ]);
  }

  /**
   * Filters and validates city data from raw pollution data
   * @param {Array} rawData - Raw data from pollution API
   * @returns {Array} Array of valid city objects
   */
  filterValidCities(rawData) {
    if (!Array.isArray(rawData)) {
      logger.warn('Invalid input: expected array');
      return [];
    }

    const validCities = [];
    let filteredCount = 0;

    for (const entry of rawData) {
      if (this.isValidCity(entry)) {
        validCities.push(this.normalizeCity(entry));
      } else {
        filteredCount++;
        logger.debug(`Filtered out invalid entry: ${JSON.stringify(entry)}`);
      }
    }

    logger.info(`Filtered out ${filteredCount} invalid entries, kept ${validCities.length} valid cities`);
    return validCities;
  }

  /**
   * Validates if an entry represents a valid city
   * @param {Object} entry - Data entry to validate
   * @returns {boolean} True if entry is a valid city
   */
  isValidCity(entry) {
    // Check if entry is an object
    if (!entry || typeof entry !== 'object') {
      return false;
    }
    // Check required fields
    const { name, country, pollution } = entry;
    
    if (!name || pollution === undefined || pollution === null) {
      return false;
    }

    // Validate city name
    if (!this.isValidCityName(name)) {
      return false;
    }

    // Validate pollution value
    if (!this.isValidPollutionValue(pollution)) {
      return false;
    }

    return true;
  }

  /**
   * Validates city name
   * @param {string} name - City name to validate
   * @returns {boolean} True if valid city name
   */
  isValidCityName(name) {
    if (typeof name !== 'string') {
      return false;
    }

    const trimmedName = name.trim();

    // Check minimum length
    if (trimmedName.length < 1 || trimmedName.length > 100) {
      return false;
    }

    // Check against invalid patterns
    for (const pattern of this.invalidPatterns) {
      if (pattern.test(trimmedName)) {
        return false;
      }
    }

    // Check for suspicious words
    const lowerName = trimmedName.toLowerCase();
    for (const word of this.suspiciousWords) {
      if (lowerName.includes(word)) {
        // Allow if it's part of a longer city name (e.g., "Port City")
        if (trimmedName.split(/\s+/).length === 1) {
          return false;
        }
      }
    }

    // Must contain at least one letter
    if (!/[a-zA-Z]/.test(trimmedName)) {
      return false;
    }

    // Should not be mostly numbers
    const letterCount = (trimmedName.match(/[a-zA-Z]/g) || []).length;
    const numberCount = (trimmedName.match(/[0-9]/g) || []).length;
    if (numberCount > letterCount) {
      return false;
    }

    return true;
  }

  /**
   * Validates country name or code
   * @param {string} country - Country to validate
   * @returns {boolean} True if valid country
   */
  isValidCountry(country) {
    if (typeof country !== 'string') {
      return false;
    }

    const trimmedCountry = country.trim();

    // Check minimum length
    if (trimmedCountry.length < 2 || trimmedCountry.length > 100) {
      return false;
    }

    // Check against invalid patterns
    for (const pattern of this.invalidPatterns) {
      if (pattern.test(trimmedCountry)) {
        return false;
      }
    }

    // If it looks like a country code, validate it
    if (trimmedCountry.length === 2 && /^[A-Z]{2}$/.test(trimmedCountry)) {
      return this.validCountryCodes.has(trimmedCountry);
    }

    // For country names, must contain letters
    if (!/[a-zA-Z]/.test(trimmedCountry)) {
      return false;
    }

    return true;
  }

  /**
   * Validates pollution value
   * @param {*} pollution - Pollution value to validate
   * @returns {boolean} True if valid pollution value
   */
  isValidPollutionValue(pollution) {
    // Convert to number if it's a string
    const numericValue = typeof pollution === 'string' ? parseFloat(pollution) : pollution;

    // Must be a valid number
    if (isNaN(numericValue) || !isFinite(numericValue)) {
      return false;
    }

    // Reasonable range for pollution values (0-1000)
    if (numericValue < 0 || numericValue > 1000) {
      return false;
    }

    return true;
  }

  /**
   * Normalizes city data to consistent format
   * @param {Object} city - Raw city data
   * @returns {Object} Normalized city data
   */
  normalizeCity(city) {
    return {
      name: String(city.name).trim(),
      country: String(city.country).trim(),
      pollution: parseFloat(city.pollution)
    };
  }
}

module.exports = new DataValidator();

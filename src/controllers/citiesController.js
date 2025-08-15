const pollutionService = require('../services/pollutionService');
const wikipediaService = require('../services/wikipediaService');
const dataValidator = require('../utils/dataValidator');
const cache = require('../utils/cache');
const logger = require('../utils/logger');

/**
 * Controller for handling cities pollution data requests
 */
const getCitiesPollution = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const cacheKey = `cities_${page}_${limit}`;

    // Check cache first
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      logger.info(`Cache hit for key: ${cacheKey}`);
      return res.json(cachedData);
    }

    logger.info(`Fetching cities data for page ${page}, limit ${limit}`);

    // Fetch raw pollution data
    const rawPollutionData = await pollutionService.fetchPollutionData(page, limit, req.query.country);

    // Normalize and validate the data
    const validCities = dataValidator.filterValidCities(rawPollutionData);
    logger.info(`Filtered to ${validCities.length} valid cities`);

    // Sort by pollution level (highest first)
    const sortedCities = validCities.sort((a, b) => b.pollution - a.pollution);

    // Calculate pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedCities = sortedCities.slice(startIndex, endIndex);

    // Enrich with Wikipedia descriptions
    const enrichedCities = await Promise.all(
      paginatedCities.map(async (city) => {
        try {
          const description = await wikipediaService.getCityDescription(city.name, city.country);
          return {
            ...city,
            description: description || `${city.name} is a city in ${city.country}.`
          };
        } catch (error) {
          logger.warn(`Failed to get description for ${city.name}: ${error.message}`);
          return {
            ...city,
            description: `${city.name} is a city in ${city.country}.`
          };
        }
      })
    );

    const response = {
      page,
      limit,
      total: validCities.length,
      cities: enrichedCities
    };

    // Cache the response for 10 minutes
    cache.set(cacheKey, response, 10 * 60 * 1000);
    
    logger.info(`Successfully processed ${enrichedCities.length} cities for page ${page}`);
    res.json(response);

  } catch (error) {
    logger.error('Error in getCitiesPollution:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch cities pollution data'
    });
  }
};

module.exports = {
  getCitiesPollution
};
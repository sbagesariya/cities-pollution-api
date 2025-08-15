const express = require('express');
const { getCitiesPollution } = require('../controllers/citiesController');
const { validatePaginationParams } = require('../middleware/validation');

const router = express.Router();

/**
 * GET /cities
 * Fetches and returns the most polluted cities by country
 * Query parameters:
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 10, max: 100)
 */
router.get('/cities', validatePaginationParams, getCitiesPollution);

module.exports = router;
const axios = require('axios'); 
const logger = require('../utils/logger'); 
const POLLUTION_API_BASE_URL = 
  process.env.POLLUTION_API_BASE_URL || 'https://be-recruitment-task.onrender.com'; 
  const AUTH_CREDENTIALS = { 
    username: process.env.POLLUTION_API_USERNAME || 'testuser', 
    password: process.env.POLLUTION_API_PASSWORD || 'testpass' 
};

class PollutionService {
  constructor() {
    this.baseURL = POLLUTION_API_BASE_URL;
    this.username = AUTH_CREDENTIALS.username;
    this.password = AUTH_CREDENTIALS.password;
    this.token = null;

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: { 'User-Agent': 'Cities-Pollution-API/1.0.0' }
    });
  }

  async authenticate() {
    logger.info('Authenticating with pollution API...');
    const res = await axios.post(`${this.baseURL}/auth/login`, {
      username: this.username,
      password: this.password
    });
    this.token = res.data.token;
    logger.info(`Got token: ${this.token}`);
  }

  async fetchPollutionData(page, limit, country = null) {
    try {
      if (!this.token) {
        await this.authenticate();
      }

      logger.info(`Fetching pollution data from ${this.baseURL}/pollution`);
      const response = await this.client.get(`/pollution`, {
        headers: {
          Authorization: `Bearer ${this.token}`
        },
        params: {
          country,
          page,
          limit
        }
      });

      if (!response.data || !Array.isArray(response.data.results)) {
        throw new Error('Invalid response format: expected array');
      }

      logger.info(`Fetched ${response.data.results.length} pollution entries`);

      return response.data;

    } catch (error) {
      logger.error('Failed to fetch pollution data:', error.message);
      throw error;
    }
  }
}

module.exports = new PollutionService();

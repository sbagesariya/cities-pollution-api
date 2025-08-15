# Cities Pollution API

A production-ready Node.js backend service that integrates with external APIs to provide pollution data for cities worldwide. The service fetches data from a pollution API, normalizes and validates it, enriches it with Wikipedia descriptions, and returns paginated results.

## Features

- **Data Integration**: Fetches pollution data from external API with authentication
- **Data Validation**: Filters out corrupted/invalid entries and non-city data
- **Data Enrichment**: Adds Wikipedia descriptions for valid cities
- **Caching**: In-memory caching to reduce API calls and improve performance
- **Rate Limiting**: Built-in protection against API abuse
- **Pagination**: Configurable pagination for large datasets
- **Production Ready**: Comprehensive logging, error handling, and security middleware

## API Endpoint

### GET /api/cities

Returns a paginated list of the most polluted cities with descriptions.

**Query Parameters:**
- `page` (optional): Page number (default: 1, max: 1000)
- `limit` (optional): Results per page (default: 10, max: 100)

**Response Format:**
```json
{
    "page": 1,
    "limit": 10,
    "total": 200,
    "cities": [
        {
            "name": "Berlin",
            "country": "Germany", 
            "pollution": 51.3,
            "description": "Berlin is the capital of Germany and one of the country's 16 states..."
        }
    ]
}
```

## How We Determine Valid Cities

The application uses several validation criteria to filter out corrupted data and non-city entries:

### City Name Validation:
- Must be a non-empty string (1-100 characters)
- Must contain at least one letter
- Cannot be purely numeric or special characters
- Cannot match patterns like "test", "sample", "null", "n/a"
- Cannot be mostly numbers (letter count must exceed number count)
- Filters out obvious non-cities containing words like "ocean", "airport", "region"

### Country Validation:
- Must be a valid string (2-100 characters)
- If 2 characters, must be a valid ISO country code
- Must contain letters and not match invalid patterns

### Pollution Value Validation:
- Must be a valid finite number
- Must be within reasonable range (0-1000)
- String numbers are converted to floats

### Additional Filtering:
- Removes entries with missing required fields (name, country, pollution)
- Normalizes data by trimming whitespace and ensuring consistent types
- Logs filtered entries for debugging and monitoring

## Installation and Setup

### Prerequisites
- Node.js 16.0.0 or higher
- npm 8.0.0 or higher

### Local Development

1. **Clone the repository:**
```bash
git clone <repository-url>
cd cities-pollution-api
```

2. **Install dependencies:**
```bash
npm install
```

3. **Create environment file:**
```bash
cp .env.example .env
```

4. **Start the development server:**
```bash
npm run dev
```

5. **Start the production server:**
```bash
npm start
```

The server will start on `http://localhost:3000` (or the port specified in PORT environment variable).

### Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with auto-restart
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues automatically

## Production Deployment

### Environment Variables

Configure these environment variables for production:

```env
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
POLLUTION_API_URL=https://be-recruitment-task.onrender.com
POLLUTION_API_USERNAME=testuser
POLLUTION_API_PASSWORD=testpass
WIKIPEDIA_API_URL=https://en.wikipedia.org/api/rest_v1
```

### Deployment Options

#### Option 1: Traditional Server
1. Clone repository on server
2. Install dependencies: `npm install --production`
3. Set environment variables
4. Start with process manager: `pm2 start src/server.js --name cities-api`

#### Option 2: Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

#### Option 3: Cloud Platforms
- **Heroku**: Connect repository and deploy
- **Railway**: Import from GitHub and deploy
- **DigitalOcean App Platform**: Create app from repository
- **AWS/Google Cloud**: Use container services or serverless functions

### Performance Considerations

1. **Caching Strategy**:
   - City data cached for 10 minutes
   - Wikipedia descriptions cached for 24 hours
   - Failed Wikipedia requests cached for 1 hour

2. **Rate Limiting**:
   - Global rate limit: 100 requests per 15 minutes per IP
   - Wikipedia API: 100ms minimum interval between requests
   - Pollution API: 30-second timeout protection

3. **Memory Usage**:
   - In-memory cache automatically expires entries
   - Cache statistics available for monitoring

## API Usage Examples

### Basic Request
```bash
curl http://localhost:3000/api/cities
```

### With Pagination and Country code params
```bash
curl "http://localhost:3000/api/cities?page=2&limit=5&country=DE"
```

### Health Check
```bash
curl http://localhost:3000/health
```

## Error Handling

The API returns structured error responses:

```json
{
    "error": "Invalid page parameter",
    "message": "Page must be a positive integer",
    "statusCode": 400
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad Request (invalid parameters)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error
- `503` - Service Unavailable (external API issues)

## Monitoring and Logs

### Logging Levels
- `error` - Critical errors requiring attention
- `warn` - Warning conditions
- `info` - General operational messages
- `debug` - Detailed debugging information

### Log Locations
- Development: Console output
- Production: `logs/error.log` and `logs/combined.log`

### Health Monitoring
Access `/health` endpoint for service status:
```json
{
    "status": "OK",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "uptime": 3600,
    "environment": "production"
}
```

## Limitations and Assumptions

### Current Limitations:
1. **In-Memory Cache**: Cache is lost on server restart (consider Redis for production)
3. **Rate Limiting**: Basic IP-based rate limiting (consider more sophisticated approaches)
4. **Wikipedia Language**: Only uses English Wikipedia
5. **Data Source**: Relies on single external pollution API

### Future Improvements:
- Add Redis for distributed caching
- Implement database storage for historical data
- Add more comprehensive city validation (geographical APIs)
- Support multiple languages for Wikipedia descriptions
- Add metrics and observability (Prometheus/Grafana)
- Implement circuit breaker pattern for external APIs
- Add automated tests and CI/CD pipeline
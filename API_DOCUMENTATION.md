# Echo Forge API Documentation

## Overview

This document describes the RESTful API for the Echo Forge voice management application. The API is built with Express.js, uses Supabase as the database, and includes comprehensive Swagger/OpenAPI documentation.

## Features

- **Full CRUD Operations** for voices
- **Swagger UI** for interactive API testing
- **OpenAPI 3.0** specification
- **Search functionality** with text matching
- **Pagination support** for large datasets
- **Error handling** with detailed messages
- **CORS enabled** for frontend integration

## API Endpoints

### Base URL
- **Development**: `http://localhost:3001`
- **Swagger UI**: `http://localhost:3001/api-docs`

### Health Check
- **GET** `/health` - Check API health status

### Voices Endpoints

#### 1. Get All Voices
```
GET /api/voices
```
**Query Parameters:**
- `user_id` (string, uuid): Filter by user ID
- `category` (string): Filter by category
- `language` (string): Filter by language  
- `limit` (integer, 1-100, default: 50): Max results
- `offset` (integer, default: 0): Pagination offset

**Response:**
```json
{
  "data": [Voice],
  "count": 150,
  "pagination": {
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

#### 2. Search Voices
```
GET /api/voices/search
```
**Query Parameters:**
- `q` (string, required): Search query for name/description
- `user_id` (string, uuid): Filter by user ID
- `limit` (integer, 1-100, default: 20): Max results

**Response:**
```json
{
  "data": [Voice],
  "query": "professional",
  "count": 5
}
```

#### 3. Get Voice by ID
```
GET /api/voices/{id}
```
**Path Parameters:**
- `id` (string, uuid, required): Voice identifier

**Response:**
```json
{
  "data": Voice
}
```

#### 4. Create New Voice
```
POST /api/voices
```
**Request Body:**
```json
{
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Professional Male Voice",
  "language": "en-US",
  "category": "professional",
  "description": "Clear professional voice for business",
  "audio_url": "https://example.com/audio/voice123.mp3",
  "duration": 120
}
```

**Response:**
```json
{
  "data": Voice,
  "message": "Voice created successfully"
}
```

#### 5. Update Voice
```
PUT /api/voices/{id}
```
**Path Parameters:**
- `id` (string, uuid, required): Voice identifier

**Request Body (partial updates allowed):**
```json
{
  "name": "Updated Voice Name",
  "description": "Updated description"
}
```

**Response:**
```json
{
  "data": Voice,
  "message": "Voice updated successfully"
}
```

#### 6. Delete Voice
```
DELETE /api/voices/{id}
```
**Path Parameters:**
- `id` (string, uuid, required): Voice identifier

**Response:**
```json
{
  "message": "Voice deleted successfully",
  "deleted_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

## Data Models

### Voice Object
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Professional Male Voice",
  "language": "en-US",
  "category": "professional",
  "description": "A clear, professional male voice",
  "audio_url": "https://example.com/audio/voice123.mp3",
  "duration": 120,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### Error Response
```json
{
  "error": "Error Type",
  "details": "Detailed error message"
}
```

## HTTP Status Codes

- **200** - Success
- **201** - Created successfully
- **400** - Bad request (validation errors)
- **404** - Resource not found
- **500** - Internal server error

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create a `.env` file from `.env.example`:
```bash
cp .env.example .env
```

Update the following variables:
- `SUPABASE_SERVICE_KEY`: Your Supabase service role key
- `PORT`: Server port (default: 3001)

### 3. Start the Server
```bash
# Development mode with auto-reload
npm run dev:server

# Production mode
npm run server
```

### 4. Access Swagger UI
Open `http://localhost:3001/api-docs` in your browser to explore and test the API interactively.

## Usage Examples

### Using curl

#### Get all voices
```bash
curl "http://localhost:3001/api/voices?limit=10"
```

#### Create a new voice
```bash
curl -X POST "http://localhost:3001/api/voices" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Test Voice",
    "language": "en-US",
    "category": "test",
    "audio_url": "https://example.com/test.mp3"
  }'
```

#### Search voices
```bash
curl "http://localhost:3001/api/voices/search?q=professional&limit=5"
```

#### Update a voice
```bash
curl -X PUT "http://localhost:3001/api/voices/{voice-id}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Voice Name",
    "description": "Updated description"
  }'
```

#### Delete a voice
```bash
curl -X DELETE "http://localhost:3001/api/voices/{voice-id}"
```

### Using JavaScript/Fetch

```javascript
// Get all voices
const voices = await fetch('http://localhost:3001/api/voices')
  .then(res => res.json());

// Create a new voice
const newVoice = await fetch('http://localhost:3001/api/voices', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'My Voice',
    language: 'en-US',
    category: 'personal',
    audio_url: 'https://example.com/my-voice.mp3'
  })
}).then(res => res.json());
```

## Security Considerations

- The API uses Supabase Row Level Security (RLS) policies
- Users can only access their own voice records
- Service key should be kept secure and not exposed to frontend
- Consider implementing authentication middleware for production

## Development Notes

- Server runs on port 3001 by default
- Frontend typically runs on port 5173 (Vite default)
- CORS is enabled for all origins in development
- Error handling includes detailed messages in development mode

## Testing with Swagger UI

1. Navigate to `http://localhost:3001/api-docs`
2. Explore the available endpoints
3. Click "Try it out" on any endpoint
4. Fill in the required parameters
5. Click "Execute" to test the API
6. View the response and status code

The Swagger UI provides:
- Interactive API testing
- Request/response examples
- Schema documentation
- Parameter validation
- Response format documentation

## Additional Features

### Pagination
All list endpoints support pagination with `limit` and `offset` parameters.

### Search
The search endpoint uses PostgreSQL's `ILIKE` operator for case-insensitive partial matching.

### Filtering
Multiple filter parameters can be combined for refined results.

### Error Handling
Comprehensive error handling with descriptive messages and appropriate HTTP status codes.
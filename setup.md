# Voice Cloning Setup Guide

## Overview

This application now includes advanced voice cloning capabilities powered by ElevenLabs API. Users can clone their voices and generate speech with custom voices.

## Prerequisites

1. **Node.js** (v18 or higher)
2. **ElevenLabs Account** with API access
3. **Supabase Project** (already configured)

## Quick Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. ElevenLabs API Setup

1. Go to [ElevenLabs](https://elevenlabs.io/)
2. Sign up for an account (free tier available)
3. Navigate to your profile and get your API key
4. Copy your API key to use in environment variables

### 3. Environment Configuration

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` and add your ElevenLabs API key:
```env
ELEVENLABS_API_KEY=your_actual_api_key_here
```

### 4. Database Migration

Run the database migration to add voice cloning support:

```bash
# If using Supabase CLI
supabase db push

# Or run the migration manually in your Supabase dashboard
# Execute the SQL from: supabase/migrations/20250125000000-add-voice-cloning-support.sql
```

### 5. Start the Application

```bash
# Start the backend server
npm run dev:server

# In another terminal, start the frontend
npm run dev
```

## Features

### Voice Cloning
- **Instant Voice Cloning**: Clone voices from 30-second audio samples
- **Professional Quality**: High-quality voice synthesis
- **Multiple Languages**: Support for 32+ languages
- **Voice Settings**: Fine-tune stability, similarity, and style

### Text-to-Speech Generation
- **Custom Voices**: Use your cloned voices
- **Real-time Generation**: Fast speech synthesis
- **Multiple Models**: Choose from different ElevenLabs models
- **Audio Download**: Save generated speech as MP3

### Voice Management
- **Voice Library**: Organize and manage cloned voices
- **Usage Tracking**: Monitor API usage and limits
- **Voice Settings**: Customize voice parameters per generation

## API Endpoints

### Voice Cloning
- `POST /api/voice-cloning/clone` - Clone a voice from audio file
- `POST /api/voice-cloning/synthesize` - Generate speech from text
- `POST /api/voice-cloning/voice-changer` - Transform existing audio
- `GET /api/voice-cloning/voices` - Get available voices
- `GET /api/voice-cloning/usage` - Get usage statistics
- `DELETE /api/voice-cloning/delete/:id` - Delete a cloned voice

### Existing Features (Preserved)
- `GET /api/voices` - Get all voices
- `POST /api/voices` - Create voice record
- `PUT /api/voices/:id` - Update voice
- `DELETE /api/voices/:id` - Delete voice
- `GET /api/voices/search` - Search voices

## Usage Guide

### 1. Clone Your Voice

1. Navigate to the **Voice Cloning** tab in the dashboard
2. Upload a clear audio file (30+ seconds recommended)
3. Enter a name and description for your voice
4. Click **Clone Voice**
5. Wait for processing (usually 30-60 seconds)

### 2. Generate Speech

1. Go to the **Generate Speech** tab
2. Enter the text you want to synthesize
3. Select your cloned voice
4. Adjust voice settings if needed
5. Click **Generate Speech**
6. Play or download the generated audio

### 3. Voice Settings

- **Stability (0-1)**: Higher values = more consistent voice
- **Similarity Boost (0-1)**: Higher values = closer to original voice
- **Style (0-1)**: Higher values = more expressive variation
- **Model**: Choose speed vs quality tradeoff

## ElevenLabs Pricing

### Free Tier
- 10,000 characters per month
- Basic voice cloning
- Standard quality

### Paid Plans (Starting at $5/month)
- Higher character limits
- Commercial usage rights
- Advanced features
- Priority processing

Visit [ElevenLabs Pricing](https://elevenlabs.io/pricing) for current plans.

## Troubleshooting

### Common Issues

**"ElevenLabs API key not configured"**
- Ensure ELEVENLABS_API_KEY is set in your .env file
- Verify the API key is valid

**"Failed to clone voice"**
- Check audio file format (MP3, WAV, M4A, OGG, WebM)
- Ensure file size is under 25MB
- Verify audio quality is good

**"Voice not found"**
- Ensure the voice was successfully cloned
- Check the database for the voice record

### File Upload Issues

**Supported Formats**: MP3, WAV, M4A, OGG, WebM
**Maximum Size**: 25MB
**Recommended**: Clear audio, minimal background noise

### Performance Optimization

- Use Flash v2.5 model for faster generation
- Smaller text snippets process faster
- Cache frequently used voices

## Security Considerations

- API keys are server-side only
- File uploads are validated and sanitized
- Temporary files are automatically cleaned up
- User isolation through Supabase RLS

## Development

### Adding New Voice Providers

The architecture supports multiple voice providers. To add a new service:

1. Create a new service file in `server/lib/`
2. Implement the standard interface
3. Add routes in `server/routes/`
4. Update the database schema if needed

### Custom Voice Settings

Voice settings are stored as JSONB in the database, allowing for:
- Provider-specific settings
- Version compatibility
- Future expansion

## Support

- **API Documentation**: Visit `/api-docs` when server is running
- **GitHub Issues**: Report bugs and feature requests
- **ElevenLabs Support**: For API-related questions

## Legal

- Ensure you have rights to clone voices
- Follow ElevenLabs terms of service
- Respect voice actor and content creator rights
- Use responsibly and ethically
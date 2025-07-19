import express from 'express';
import { supabase } from '../lib/supabase.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Mock TTS service function - replace with actual TTS service integration
const generateSpeechAudio = async (text, voiceId = null) => {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock audio URL and duration calculation
  const mockAudioUrl = `https://example.com/audio/${uuidv4()}.mp3`;
  const mockDurationSeconds = Math.floor(text.length / 10) + 5; // Rough estimation
  
  return {
    audioUrl: mockAudioUrl,
    durationSeconds: mockDurationSeconds
  };
};

// POST /generate-speech
router.post('/generate-speech', async (req, res) => {
  try {
    const { user_id, voice_id, text } = req.body;

    // Validate required fields
    if (!user_id || !text) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'user_id and text are required'
      });
    }

    if (typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({
        error: 'Invalid text',
        details: 'Text must be a non-empty string'
      });
    }

    console.log('Generating speech for user:', user_id, 'with text:', text.substring(0, 50) + '...');

    // Generate speech audio (mock implementation)
    const { audioUrl, durationSeconds } = await generateSpeechAudio(text, voice_id);

    // Create new voice generation record
    const newGeneration = {
      id: uuidv4(),
      user_id,
      voice_id: voice_id || null,
      input_text: text,
      audio_url: audioUrl,
      is_favorite: false,
      duration_seconds: durationSeconds,
      name: text.substring(0, 50) + (text.length > 50 ? '...' : ''), // Auto-generate name from text
      created_at: new Date().toISOString()
    };

    // Insert into database
    const { data, error } = await supabase
      .from('voice_generations')
      .insert([newGeneration])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({
        error: 'Failed to save voice generation',
        details: error.message
      });
    }

    console.log('Successfully created voice generation:', data.id);

    // Return the created record
    res.status(201).json(data);

  } catch (error) {
    console.error('Error in generate-speech:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// GET /voice-generations
router.get('/voice-generations', async (req, res) => {
  try {
    const { user_id } = req.query;

    // Validate required parameter
    if (!user_id) {
      return res.status(400).json({
        error: 'Missing required parameter',
        details: 'user_id query parameter is required'
      });
    }

    console.log('Fetching voice generations for user:', user_id);

    // Fetch voice generations from database
    const { data, error } = await supabase
      .from('voice_generations')
      .select(`
        id,
        user_id,
        voice_id,
        text,
        audio_url,
        is_favorite,
        duration_seconds,
        name,
        created_at
      `)
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({
        error: 'Failed to fetch voice generations',
        details: error.message
      });
    }

    console.log(`Found ${data.length} voice generations for user ${user_id}`);

    // Return the voice generations
    res.status(200).json(data);

  } catch (error) {
    console.error('Error in voice-generations:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

export default router;
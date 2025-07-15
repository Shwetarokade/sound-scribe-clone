import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';
import { supabase, handleSupabaseError } from '../lib/supabase.js';
import elevenLabsService from '../lib/elevenLabsService.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/audio';
    fs.ensureDirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp3|wav|flac|m4a|ogg|webm/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  },
});

/**
 * @swagger
 * tags:
 *   name: Voice Cloning
 *   description: Voice cloning and synthesis endpoints
 */

/**
 * @swagger
 * /api/voice-cloning/clone:
 *   post:
 *     summary: Clone a voice from audio sample
 *     description: Create a voice clone using ElevenLabs instant voice cloning
 *     tags: [Voice Cloning]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: audio
 *         type: file
 *         required: true
 *         description: Audio file for voice cloning (max 25MB)
 *       - in: formData
 *         name: name
 *         type: string
 *         required: true
 *         description: Name for the cloned voice
 *       - in: formData
 *         name: description
 *         type: string
 *         description: Optional description for the voice
 *       - in: formData
 *         name: user_id
 *         type: string
 *         format: uuid
 *         required: true
 *         description: User ID who owns this voice
 *       - in: formData
 *         name: language
 *         type: string
 *         description: Language of the voice
 *       - in: formData
 *         name: category
 *         type: string
 *         description: Category of the voice
 *     responses:
 *       201:
 *         description: Voice cloned successfully
 *       400:
 *         description: Bad request or validation error
 *       500:
 *         description: Internal server error
 */
router.post('/clone', upload.single('audio'), async (req, res) => {
  let tempFilePath = null;

  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Validation Error',
        details: 'Audio file is required',
      });
    }

    const { name, description = '', user_id, language = 'en-US', category = 'cloned' } = req.body;

    if (!name || !user_id) {
      // Clean up uploaded file
      await fs.remove(req.file.path);
      return res.status(400).json({
        error: 'Validation Error',
        details: 'Name and user_id are required',
      });
    }

    tempFilePath = req.file.path;

    // Clone voice using ElevenLabs
    const cloneResult = await elevenLabsService.cloneVoice(req.file, name, description);

    if (!cloneResult.success) {
      throw new Error('Voice cloning failed');
    }

    // Save voice record to Supabase
    const { data: voiceData, error: dbError } = await supabase
      .from('voices')
      .insert({
        user_id,
        name,
        language,
        voice_type: 'cloned',
        description,
        external_voice_id: cloneResult.voice_id,
        provider: 'elevenlabs',
        audio_url: null, // ElevenLabs handles audio storage
        duration: 0, // Will be set when we get audio metadata
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8,
          style: 0.0,
          use_speaker_boost: true,
          model_id: 'eleven_multilingual_v2'
        },
        is_cloned: true,
        clone_quality: 'standard',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // Try to clean up the cloned voice from ElevenLabs
      try {
        await elevenLabsService.deleteVoice(cloneResult.voice_id);
      } catch (cleanupError) {
        console.error('Failed to cleanup cloned voice:', cleanupError);
      }
      return res.status(500).json(handleSupabaseError(dbError));
    }

    // Clean up temporary file
    await fs.remove(tempFilePath);

    res.status(201).json({
      data: voiceData,
      elevenlabs_voice_id: cloneResult.voice_id,
      message: 'Voice cloned successfully',
    });
  } catch (error) {
    console.error('Voice cloning error:', error);

    // Clean up temporary file if it exists
    if (tempFilePath) {
      try {
        await fs.remove(tempFilePath);
      } catch (cleanupError) {
        console.error('Failed to cleanup temp file:', cleanupError);
      }
    }

    res.status(500).json({
      error: 'Voice Cloning Error',
      details: error.message || 'Failed to clone voice',
    });
  }
});

/**
 * @swagger
 * /api/voice-cloning/synthesize:
 *   post:
 *     summary: Generate speech from text using a cloned voice
 *     description: Convert text to speech using ElevenLabs with a specific voice
 *     tags: [Voice Cloning]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [text, voice_id]
 *             properties:
 *               text:
 *                 type: string
 *                 description: Text to convert to speech
 *                 example: "Hello, this is a test of my cloned voice."
 *               voice_id:
 *                 type: string
 *                 description: ElevenLabs voice ID or Supabase voice ID
 *                 example: "abc123def456"
 *               options:
 *                 type: object
 *                 properties:
 *                   stability:
 *                     type: number
 *                     minimum: 0
 *                     maximum: 1
 *                     default: 0.5
 *                   similarity_boost:
 *                     type: number
 *                     minimum: 0
 *                     maximum: 1
 *                     default: 0.8
 *                   style:
 *                     type: number
 *                     minimum: 0
 *                     maximum: 1
 *                     default: 0.0
 *                   use_speaker_boost:
 *                     type: boolean
 *                     default: true
 *                   model_id:
 *                     type: string
 *                     default: "eleven_multilingual_v2"
 *     responses:
 *       200:
 *         description: Audio generated successfully
 *         content:
 *           audio/mpeg:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Bad request
 *       404:
 *         description: Voice not found
 *       500:
 *         description: Internal server error
 */
router.post('/synthesize', async (req, res) => {
  try {
    const { text, voice_id, options = {} } = req.body;

    if (!text || !voice_id) {
      return res.status(400).json({
        error: 'Validation Error',
        details: 'Text and voice_id are required',
      });
    }

    let elevenLabsVoiceId = voice_id;

    // Check if voice_id is a UUID (Supabase ID) and get ElevenLabs voice ID
    if (voice_id.length === 36 && voice_id.includes('-')) {
      const { data: voiceData, error: dbError } = await supabase
        .from('voices')
        .select('external_voice_id')
        .eq('id', voice_id)
        .eq('provider', 'elevenlabs')
        .single();

      if (dbError || !voiceData) {
        return res.status(404).json({
          error: 'Voice Not Found',
          details: 'Voice not found in database',
        });
      }

      elevenLabsVoiceId = voiceData.external_voice_id;
    }

    // Generate speech using ElevenLabs
    const result = await elevenLabsService.textToSpeech(text, elevenLabsVoiceId, options);

    if (!result.success) {
      throw new Error('Speech synthesis failed');
    }

    // Set appropriate headers for audio response
    res.set({
      'Content-Type': result.contentType,
      'Content-Disposition': `attachment; filename="speech-${Date.now()}.mp3"`,
    });

    res.send(Buffer.from(result.audioBuffer));
  } catch (error) {
    console.error('Speech synthesis error:', error);
    res.status(500).json({
      error: 'Speech Synthesis Error',
      details: error.message || 'Failed to generate speech',
    });
  }
});

/**
 * @swagger
 * /api/voice-cloning/voices:
 *   get:
 *     summary: Get all available ElevenLabs voices
 *     description: Retrieve all voices from user's ElevenLabs account
 *     tags: [Voice Cloning]
 *     responses:
 *       200:
 *         description: Voices retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/voices', async (req, res) => {
  try {
    const result = await elevenLabsService.getVoices();
    
    res.json({
      data: result.voices,
      success: result.success,
      message: result.success ? 'Voices retrieved successfully' : 'ElevenLabs service unavailable',
    });
  } catch (error) {
    console.error('Error fetching ElevenLabs voices:', error);
    res.status(500).json({
      error: 'Service Error',
      details: error.message || 'Failed to fetch voices',
    });
  }
});

/**
 * @swagger
 * /api/voice-cloning/voice-changer:
 *   post:
 *     summary: Transform existing audio with a different voice
 *     description: Use ElevenLabs voice changer to transform audio
 *     tags: [Voice Cloning]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: audio
 *         type: file
 *         required: true
 *         description: Source audio file to transform
 *       - in: formData
 *         name: target_voice_id
 *         type: string
 *         required: true
 *         description: Target voice ID for transformation
 *       - in: formData
 *         name: stability
 *         type: number
 *         description: Voice stability (0-1)
 *       - in: formData
 *         name: similarity_boost
 *         type: number
 *         description: Similarity boost (0-1)
 *       - in: formData
 *         name: style
 *         type: number
 *         description: Style setting (0-1)
 *     responses:
 *       200:
 *         description: Voice transformation successful
 *         content:
 *           audio/mpeg:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.post('/voice-changer', upload.single('audio'), async (req, res) => {
  let tempFilePath = null;

  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Validation Error',
        details: 'Audio file is required',
      });
    }

    const {
      target_voice_id,
      stability = 1.0,
      similarity_boost = 1.0,
      style = 0.0,
      use_speaker_boost = true,
    } = req.body;

    if (!target_voice_id) {
      await fs.remove(req.file.path);
      return res.status(400).json({
        error: 'Validation Error',
        details: 'Target voice ID is required',
      });
    }

    tempFilePath = req.file.path;

    // Transform voice using ElevenLabs
    const result = await elevenLabsService.changeVoice(req.file, target_voice_id, {
      stability: parseFloat(stability),
      similarity_boost: parseFloat(similarity_boost),
      style: parseFloat(style),
      use_speaker_boost: use_speaker_boost === 'true',
    });

    // Clean up temporary file
    await fs.remove(tempFilePath);

    if (!result.success) {
      throw new Error('Voice transformation failed');
    }

    // Set appropriate headers for audio response
    res.set({
      'Content-Type': result.contentType,
      'Content-Disposition': `attachment; filename="transformed-${Date.now()}.mp3"`,
    });

    res.send(Buffer.from(result.audioBuffer));
  } catch (error) {
    console.error('Voice transformation error:', error);

    // Clean up temporary file if it exists
    if (tempFilePath) {
      try {
        await fs.remove(tempFilePath);
      } catch (cleanupError) {
        console.error('Failed to cleanup temp file:', cleanupError);
      }
    }

    res.status(500).json({
      error: 'Voice Transformation Error',
      details: error.message || 'Failed to transform voice',
    });
  }
});

/**
 * @swagger
 * /api/voice-cloning/usage:
 *   get:
 *     summary: Get ElevenLabs usage information
 *     description: Retrieve current usage and limits from ElevenLabs account
 *     tags: [Voice Cloning]
 *     responses:
 *       200:
 *         description: Usage information retrieved
 *       500:
 *         description: Internal server error
 */
router.get('/usage', async (req, res) => {
  try {
    const result = await elevenLabsService.getUsage();
    
    res.json({
      data: result.usage,
      success: result.success,
      message: result.success ? 'Usage retrieved successfully' : 'ElevenLabs service unavailable',
    });
  } catch (error) {
    console.error('Error fetching usage:', error);
    res.status(500).json({
      error: 'Service Error',
      details: error.message || 'Failed to fetch usage information',
    });
  }
});

/**
 * @swagger
 * /api/voice-cloning/models:
 *   get:
 *     summary: Get available ElevenLabs models
 *     description: Retrieve all available models from ElevenLabs
 *     tags: [Voice Cloning]
 *     responses:
 *       200:
 *         description: Models retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/models', async (req, res) => {
  try {
    const result = await elevenLabsService.getModels();
    
    res.json({
      data: result.models,
      success: result.success,
      message: result.success ? 'Models retrieved successfully' : 'ElevenLabs service unavailable',
    });
  } catch (error) {
    console.error('Error fetching models:', error);
    res.status(500).json({
      error: 'Service Error',
      details: error.message || 'Failed to fetch models',
    });
  }
});

/**
 * @swagger
 * /api/voice-cloning/delete/{voice_id}:
 *   delete:
 *     summary: Delete a cloned voice
 *     description: Delete a voice from both ElevenLabs and local database
 *     tags: [Voice Cloning]
 *     parameters:
 *       - in: path
 *         name: voice_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Voice ID (Supabase UUID)
 *     responses:
 *       200:
 *         description: Voice deleted successfully
 *       404:
 *         description: Voice not found
 *       500:
 *         description: Internal server error
 */
router.delete('/delete/:voice_id', async (req, res) => {
  try {
    const { voice_id } = req.params;

    // Get voice data from database
    const { data: voiceData, error: dbError } = await supabase
      .from('voices')
      .select('external_voice_id, provider')
      .eq('id', voice_id)
      .single();

    if (dbError || !voiceData) {
      return res.status(404).json({
        error: 'Voice Not Found',
        details: 'Voice not found in database',
      });
    }

    // Delete from ElevenLabs if it's a cloned voice
    if (voiceData.provider === 'elevenlabs' && voiceData.external_voice_id) {
      try {
        await elevenLabsService.deleteVoice(voiceData.external_voice_id);
      } catch (elevenLabsError) {
        console.error('Failed to delete from ElevenLabs:', elevenLabsError);
        // Continue with database deletion even if ElevenLabs deletion fails
      }
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('voices')
      .delete()
      .eq('id', voice_id);

    if (deleteError) {
      return res.status(500).json(handleSupabaseError(deleteError));
    }

    res.json({
      message: 'Voice deleted successfully',
      deleted_id: voice_id,
    });
  } catch (error) {
    console.error('Voice deletion error:', error);
    res.status(500).json({
      error: 'Deletion Error',
      details: error.message || 'Failed to delete voice',
    });
  }
});

export default router;
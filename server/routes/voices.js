import express from 'express';
import { supabase, handleSupabaseError } from '../lib/supabase.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Voices
 *   description: Voice management endpoints
 */

/**
 * @swagger
 * /api/voices:
 *   get:
 *     summary: Get all voices
 *     description: Retrieve all voices from the database with optional filtering
 *     tags: [Voices]
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter voices by user ID
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter voices by category
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *         description: Filter voices by language
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Maximum number of voices to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of voices to skip for pagination
 *     responses:
 *       200:
 *         description: Successfully retrieved voices
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Voice'
 *                 count:
 *                   type: integer
 *                   description: Total number of voices matching the criteria
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     limit:
 *                       type: integer
 *                     offset:
 *                       type: integer
 *                     hasMore:
 *                       type: boolean
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/', async (req, res) => {
  try {
    const { user_id, category, language, limit = 50, offset = 0 } = req.query;
    
    // Validate limit and offset
    const validLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
    const validOffset = Math.max(parseInt(offset) || 0, 0);

    let query = supabase
      .from('voices')
      .select('*', { count: 'exact' })
      .range(validOffset, validOffset + validLimit - 1)
      .order('created_at', { ascending: false });

    // Apply filters
    if (user_id) {
      query = query.eq('user_id', user_id);
    }
    if (category) {
      query = query.eq('category', category);
    }
    if (language) {
      query = query.eq('language', language);
    }

    const { data, error, count } = await query;

    if (error) {
      return res.status(400).json(handleSupabaseError(error));
    }

    res.json({
      data: data || [],
      count: count || 0,
      pagination: {
        limit: validLimit,
        offset: validOffset,
        hasMore: (count || 0) > validOffset + validLimit
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      details: error.message
    });
  }
});

/**
 * @swagger
 * /api/voices/search:
 *   get:
 *     summary: Search voices
 *     description: Search voices by name or description using text search
 *     tags: [Voices]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query for voice name or description
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by user ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Maximum number of results to return
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Voice'
 *                 query:
 *                   type: string
 *                   description: The search query used
 *                 count:
 *                   type: integer
 *                   description: Number of results found
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/search', async (req, res) => {
  try {
    const { q, user_id, limit = 20 } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        details: 'Search query (q) is required'
      });
    }

    const validLimit = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
    const searchTerm = q.trim();

    let query = supabase
      .from('voices')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .limit(validLimit)
      .order('created_at', { ascending: false });

    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(400).json(handleSupabaseError(error));
    }

    res.json({
      data: data || [],
      query: searchTerm,
      count: (data || []).length
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      details: error.message
    });
  }
});

/**
 * @swagger
 * /api/voices/{id}:
 *   get:
 *     summary: Get voice by ID
 *     description: Retrieve a specific voice by its unique identifier
 *     tags: [Voices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The voice ID
 *     responses:
 *       200:
 *         description: Successfully retrieved the voice
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Voice'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('voices')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Not Found',
          details: 'Voice not found'
        });
      }
      return res.status(400).json(handleSupabaseError(error));
    }

    res.json({ data });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      details: error.message
    });
  }
});

/**
 * @swagger
 * /api/voices:
 *   post:
 *     summary: Create a new voice
 *     description: Add a new voice to the database
 *     tags: [Voices]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VoiceInput'
 *     responses:
 *       201:
 *         description: Voice created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Voice'
 *                 message:
 *                   type: string
 *                   example: Voice created successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/', async (req, res) => {
  try {
    const { user_id, name, language, category, description, audio_url, duration } = req.body;

    // Validate required fields
    if (!user_id || !name || !language || !category || !audio_url) {
      return res.status(400).json({
        error: 'Bad Request',
        details: 'Missing required fields: user_id, name, language, category, audio_url'
      });
    }

    // Prepare voice data
    const voiceData = {
      user_id,
      name,
      language,
      category,
      description: description || null,
      audio_url,
      duration: duration || null
    };

    const { data, error } = await supabase
      .from('voices')
      .insert([voiceData])
      .select()
      .single();

    if (error) {
      return res.status(400).json(handleSupabaseError(error));
    }

    res.status(201).json({
      data,
      message: 'Voice created successfully'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      details: error.message
    });
  }
});

/**
 * @swagger
 * /api/voices/{id}:
 *   put:
 *     summary: Update voice by ID
 *     description: Update an existing voice with new data
 *     tags: [Voices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The voice ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the voice
 *               language:
 *                 type: string
 *                 description: Language of the voice
 *               category:
 *                 type: string
 *                 description: Category of the voice
 *               description:
 *                 type: string
 *                 nullable: true
 *                 description: Optional description of the voice
 *               audio_url:
 *                 type: string
 *                 format: uri
 *                 description: URL to the audio file
 *               duration:
 *                 type: integer
 *                 nullable: true
 *                 description: Duration of the audio in seconds
 *     responses:
 *       200:
 *         description: Voice updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Voice'
 *                 message:
 *                   type: string
 *                   example: Voice updated successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, language, category, description, audio_url, duration } = req.body;

    // Check if voice exists first
    const { data: existingVoice, error: fetchError } = await supabase
      .from('voices')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Not Found',
          details: 'Voice not found'
        });
      }
      return res.status(400).json(handleSupabaseError(fetchError));
    }

    // Prepare update data (only include fields that are provided)
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (language !== undefined) updateData.language = language;
    if (category !== undefined) updateData.category = category;
    if (description !== undefined) updateData.description = description;
    if (audio_url !== undefined) updateData.audio_url = audio_url;
    if (duration !== undefined) updateData.duration = duration;
    updateData.updated_at = new Date().toISOString();

    // Ensure at least one field is being updated
    if (Object.keys(updateData).length <= 1) { // Only updated_at
      return res.status(400).json({
        error: 'Bad Request',
        details: 'At least one field must be provided for update'
      });
    }

    const { data, error } = await supabase
      .from('voices')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json(handleSupabaseError(error));
    }

    res.json({
      data,
      message: 'Voice updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      details: error.message
    });
  }
});

/**
 * @swagger
 * /api/voices/{id}:
 *   delete:
 *     summary: Delete voice by ID
 *     description: Remove a voice from the database
 *     tags: [Voices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The voice ID
 *     responses:
 *       200:
 *         description: Voice deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Voice deleted successfully
 *                 deleted_id:
 *                   type: string
 *                   format: uuid
 *                   description: ID of the deleted voice
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if voice exists first
    const { data: existingVoice, error: fetchError } = await supabase
      .from('voices')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Not Found',
          details: 'Voice not found'
        });
      }
      return res.status(400).json(handleSupabaseError(fetchError));
    }

    const { error } = await supabase
      .from('voices')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json(handleSupabaseError(error));
    }

    res.json({
      message: 'Voice deleted successfully',
      deleted_id: id
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      details: error.message
    });
  }
});

export default router;
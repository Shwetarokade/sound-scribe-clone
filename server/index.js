import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import dotenv from 'dotenv';
import fs from 'fs-extra';
import path from 'path';
import voicesRouter from './routes/voices.js';
import voiceCloningRouter from './routes/voiceCloning.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Ensure uploads directory exists
fs.ensureDirSync('uploads/audio');

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files statically (for development)
app.use('/uploads', express.static('uploads'));

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Echo Forge API',
      version: '1.0.0',
      description: 'RESTful API for Echo Forge voice management application built with Supabase',
      contact: {
        name: 'Echo Forge API Support',
        email: 'support@echoforge.com'
      }
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server'
      }
    ],
    components: {
      schemas: {
        Voice: {
          type: 'object',
          required: ['name', 'language', 'category', 'audio_url', 'user_id'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique identifier for the voice',
              example: '550e8400-e29b-41d4-a716-446655440000'
            },
            user_id: {
              type: 'string',
              format: 'uuid',
              description: 'ID of the user who owns this voice',
              example: '123e4567-e89b-12d3-a456-426614174000'
            },
            name: {
              type: 'string',
              description: 'Name of the voice',
              example: 'Professional Male Voice'
            },
            language: {
              type: 'string',
              description: 'Language of the voice',
              example: 'en-US'
            },
            category: {
              type: 'string',
              description: 'Category of the voice',
              example: 'professional'
            },
            description: {
              type: 'string',
              nullable: true,
              description: 'Optional description of the voice',
              example: 'A clear, professional male voice suitable for business presentations'
            },
            audio_url: {
              type: 'string',
              format: 'uri',
              description: 'URL to the audio file',
              example: 'https://example.com/audio/voice123.mp3'
            },
            duration: {
              type: 'integer',
              nullable: true,
              description: 'Duration of the audio in seconds',
              example: 120
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp when the voice was created'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp when the voice was last updated'
            }
          }
        },
        VoiceInput: {
          type: 'object',
          required: ['name', 'language', 'category', 'audio_url', 'user_id'],
          properties: {
            user_id: {
              type: 'string',
              format: 'uuid',
              description: 'ID of the user who owns this voice',
              example: '123e4567-e89b-12d3-a456-426614174000'
            },
            name: {
              type: 'string',
              description: 'Name of the voice',
              example: 'Professional Male Voice'
            },
            language: {
              type: 'string',
              description: 'Language of the voice',
              example: 'en-US'
            },
            category: {
              type: 'string',
              description: 'Category of the voice',
              example: 'professional'
            },
            description: {
              type: 'string',
              nullable: true,
              description: 'Optional description of the voice',
              example: 'A clear, professional male voice suitable for business presentations'
            },
            audio_url: {
              type: 'string',
              format: 'uri',
              description: 'URL to the audio file',
              example: 'https://example.com/audio/voice123.mp3'
            },
            duration: {
              type: 'integer',
              nullable: true,
              description: 'Duration of the audio in seconds',
              example: 120
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message'
            },
            details: {
              type: 'string',
              description: 'Additional error details'
            }
          }
        }
      },
      responses: {
        BadRequest: {
          description: 'Bad request',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        InternalServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        }
      }
    }
  },
  apis: ['./server/routes/*.js'], // Path to the API docs
};

const swaggerSpecs = swaggerJsdoc(swaggerOptions);

// Swagger UI endpoint
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Echo Forge API Documentation'
}));

// API Routes
app.use('/api/voices', voicesRouter);
app.use('/api/voice-cloning', voiceCloningRouter);

// Health check endpoint
/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the health status of the API
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Echo Forge API',
    documentation: '/api-docs',
    health: '/health'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    details: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong!'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    details: `Route ${req.method} ${req.path} not found`
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Echo Forge API server running on http://localhost:${PORT}`);
  console.log(`📚 API Documentation available at http://localhost:${PORT}/api-docs`);
  console.log(`💚 Health check available at http://localhost:${PORT}/health`);
});
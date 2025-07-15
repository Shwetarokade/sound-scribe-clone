import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs-extra';

class ElevenLabsService {
  constructor() {
    this.baseURL = 'https://api.elevenlabs.io/v1';
    this.apiKey = process.env.ELEVENLABS_API_KEY;
    
    if (!this.apiKey) {
      console.warn('ELEVENLABS_API_KEY not found in environment variables. Voice cloning features will be disabled.');
    }

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'xi-api-key': this.apiKey,
        'Accept': 'application/json',
      },
    });
  }

  // Check if ElevenLabs service is available
  isAvailable() {
    return !!this.apiKey;
  }

  // Clone a voice using instant voice cloning
  async cloneVoice(audioFile, voiceName, description = '') {
    if (!this.isAvailable()) {
      throw new Error('ElevenLabs API key not configured');
    }

    try {
      const formData = new FormData();
      formData.append('name', voiceName);
      formData.append('description', description);
      formData.append('files', fs.createReadStream(audioFile.path), audioFile.originalname);

      const response = await this.client.post('/voices/add', formData, {
        headers: {
          ...formData.getHeaders(),
        },
      });

      return {
        success: true,
        voice_id: response.data.voice_id,
        name: voiceName,
        description: description,
      };
    } catch (error) {
      console.error('Voice cloning error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.detail?.message || 'Failed to clone voice');
    }
  }

  // Generate speech from text using a cloned voice
  async textToSpeech(text, voiceId, options = {}) {
    if (!this.isAvailable()) {
      throw new Error('ElevenLabs API key not configured');
    }

    try {
      const {
        stability = 0.5,
        similarity_boost = 0.8,
        style = 0.0,
        use_speaker_boost = true,
        model_id = 'eleven_multilingual_v2'
      } = options;

      const response = await this.client.post(
        `/text-to-speech/${voiceId}`,
        {
          text,
          voice_settings: {
            stability,
            similarity_boost,
            style,
            use_speaker_boost,
          },
          model_id,
        },
        {
          responseType: 'arraybuffer',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        audioBuffer: response.data,
        contentType: 'audio/mpeg',
      };
    } catch (error) {
      console.error('Text-to-speech error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.detail?.message || 'Failed to generate speech');
    }
  }

  // Get all voices from ElevenLabs account
  async getVoices() {
    if (!this.isAvailable()) {
      return { success: false, voices: [] };
    }

    try {
      const response = await this.client.get('/voices');
      return {
        success: true,
        voices: response.data.voices.map(voice => ({
          voice_id: voice.voice_id,
          name: voice.name,
          category: voice.category,
          description: voice.description,
          preview_url: voice.preview_url,
          available_for_tiers: voice.available_for_tiers,
          settings: voice.settings,
        })),
      };
    } catch (error) {
      console.error('Error fetching voices:', error.response?.data || error.message);
      return { success: false, voices: [] };
    }
  }

  // Get voice details by ID
  async getVoice(voiceId) {
    if (!this.isAvailable()) {
      throw new Error('ElevenLabs API key not configured');
    }

    try {
      const response = await this.client.get(`/voices/${voiceId}`);
      return {
        success: true,
        voice: response.data,
      };
    } catch (error) {
      console.error('Error fetching voice:', error.response?.data || error.message);
      throw new Error('Voice not found');
    }
  }

  // Delete a cloned voice
  async deleteVoice(voiceId) {
    if (!this.isAvailable()) {
      throw new Error('ElevenLabs API key not configured');
    }

    try {
      await this.client.delete(`/voices/${voiceId}`);
      return { success: true };
    } catch (error) {
      console.error('Error deleting voice:', error.response?.data || error.message);
      throw new Error('Failed to delete voice');
    }
  }

  // Get user subscription info
  async getSubscription() {
    if (!this.isAvailable()) {
      return { success: false, subscription: null };
    }

    try {
      const response = await this.client.get('/user/subscription');
      return {
        success: true,
        subscription: response.data,
      };
    } catch (error) {
      console.error('Error fetching subscription:', error.response?.data || error.message);
      return { success: false, subscription: null };
    }
  }

  // Get user usage info
  async getUsage() {
    if (!this.isAvailable()) {
      return { success: false, usage: null };
    }

    try {
      const response = await this.client.get('/user');
      return {
        success: true,
        usage: {
          character_count: response.data.subscription.character_count,
          character_limit: response.data.subscription.character_limit,
          can_extend_character_limit: response.data.subscription.can_extend_character_limit,
        },
      };
    } catch (error) {
      console.error('Error fetching usage:', error.response?.data || error.message);
      return { success: false, usage: null };
    }
  }

  // Voice changer - transform existing audio with a different voice
  async changeVoice(audioFile, targetVoiceId, options = {}) {
    if (!this.isAvailable()) {
      throw new Error('ElevenLabs API key not configured');
    }

    try {
      const {
        stability = 1.0,
        similarity_boost = 1.0,
        style = 0.0,
        use_speaker_boost = true,
      } = options;

      const formData = new FormData();
      formData.append('audio', fs.createReadStream(audioFile.path), audioFile.originalname);
      formData.append('voice_settings', JSON.stringify({
        stability,
        similarity_boost,
        style,
        use_speaker_boost,
      }));

      const response = await this.client.post(
        `/voice-conversion/${targetVoiceId}`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
          responseType: 'arraybuffer',
        }
      );

      return {
        success: true,
        audioBuffer: response.data,
        contentType: 'audio/mpeg',
      };
    } catch (error) {
      console.error('Voice conversion error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.detail?.message || 'Failed to convert voice');
    }
  }

  // Get available models
  async getModels() {
    if (!this.isAvailable()) {
      return { success: false, models: [] };
    }

    try {
      const response = await this.client.get('/models');
      return {
        success: true,
        models: response.data,
      };
    } catch (error) {
      console.error('Error fetching models:', error.response?.data || error.message);
      return { success: false, models: [] };
    }
  }
}

export default new ElevenLabsService();
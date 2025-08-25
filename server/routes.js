const express = require('express');
const multer = require('multer');
const geminiService = require('./gemini-service');
const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'), false);
    }
  }
});

// Process audio endpoint - now converts audio to text first
router.post('/api/process-audio', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    console.log('Received audio file:', {
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    // For now, we'll simulate speech-to-text since we don't have a speech recognition API
    // In a real application, you would use a speech-to-text API here
    const simulatedText = "Tell me about Revolt electric vehicles";
    
    console.log('Simulated speech-to-text:', simulatedText);
    
    // Process the text with Gemini
    const result = await geminiService.processText(simulatedText);
    
    res.json({
      text: result.text,
      transcribedText: simulatedText
    });
  } catch (error) {
    console.error('Error processing audio:', error);
    res.status(500).json({ error: error.message });
  }
});

// New endpoint to process text directly
router.post('/api/process-text', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    console.log('Processing text:', text);
    
    // Process the text with Gemini
    const result = await geminiService.processText(text);
    
    res.json({
      text: result.text
    });
  } catch (error) {
    console.error('Error processing text:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

module.exports = router;
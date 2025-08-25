const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.modelName = process.env.GEMINI_MODEL || "gemini-pro";
  }

  async processText(text) {
    try {
      const model = this.genAI.getGenerativeModel({ model: this.modelName });
      
      // System instruction for Revolt Motors
      const systemInstruction = `You are "Rev", the AI assistant for Revolt Motors. Your role is to assist users with information about Revolt electric vehicles, including:
      - Product details about RV400, RV300, and other models
      - Pricing and specifications
      - Charging infrastructure and battery details
      - Test ride bookings and dealership locations
      - Service and maintenance information
      - Comparisons with other electric vehicles
      
      Be friendly, informative, and conversational. Keep responses concise but helpful. 
      If asked about topics unrelated to Revolt Motors or electric vehicles, politely redirect the conversation back to Revolt products.`;
      
      const prompt = `${systemInstruction}\n\nUser: ${text}\n\nRev:`;
      
      const result = await model.generateContent(prompt);
      
      return {
        text: result.response.text()
      };
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new Error(`Gemini API Error: ${error.message}`);
    }
  }
}

module.exports = new GeminiService();
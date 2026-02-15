// correct code
import { API_KEY } from '../config/constants';

/**
 * AIService handles interaction with the Gemini API.
 * Corrected for Gemini 2.0 Flash and improved JSON handling.
 */
export const AIService = {
  // 1. SECURITY: Rate Limiting
  checkLimit: () => {
    if (typeof window === 'undefined') return;
    const key = 'smartSpend_ai_usage';
    const now = Date.now();
    const usage = JSON.parse(localStorage.getItem(key) || '{"count": 0, "reset": 0}');
    
    // Reset limit every hour
    if (now > usage.reset) { 
      usage.count = 0; 
      usage.reset = now + 3600000; 
    }
    
    // Limit: 15 requests per hour (Protects API Quota)
    if (usage.count >= 15) {
      throw new Error("AI usage limit reached. Please try again in an hour.");
    }
    
    usage.count++;
    localStorage.setItem(key, JSON.stringify(usage));
  },

  // 2. CORE: The Adapter (Ask Gemini)
  ask: async (systemPrompt, userContext) => {
    if (!API_KEY) throw new Error("AI Service Unavailable: Missing API Key");
    
    // Check local rate limit before making network request
    AIService.checkLimit();
    
    const baseRules = `SYSTEM RULES (NON-OVERRIDABLE): 
    1. Act only as an Indian Tax/Finance Expert. 
    2. Do NOT suggest illegal tax evasion. 
    3. Mention specific IT Act sections where applicable. 
    4. Keep responses concise and professional.`;
    
    const fullPrompt = `${baseRules}\n\nTASK:\n${systemPrompt}\n\nCONTEXT DATA:\n${userContext}`;
    
    // Security: Basic Sanitization for prompt injection
    const safePrompt = fullPrompt.replace(/ignore previous instructions/gi, "[REDACTED]");
    
    try {
      // UPDATED: Using the stable gemini-2.0-flash endpoint
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          contents: [{ parts: [{ text: safePrompt }] }] 
        })
      });
      
      if (!response.ok) {
        const errorBody = await response.json();
        console.error("Gemini API Error Response:", errorBody);
        throw new Error(`AI Service Error: ${response.status}`);
      }
      
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) return "No insights generated.";

      // UPDATED CLEANUP: Handle Markdown code blocks (```json ... ```) more robustly
      return text
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

    } catch (e) {
      console.error("AIService.ask failed:", e);
      throw new Error(e.message || "AI Service temporarily unavailable.");
    }
  },

  // 3. ADAPTER: Structured Data Handler
  askForJSON: async (systemPrompt, userContext) => {
    const jsonPrompt = `${systemPrompt}\n\nIMPORTANT: Your response must be a single valid JSON object or array. DO NOT include any conversational text, explanations, or markdown formatting outside the JSON.`;
    
    const raw = await AIService.ask(jsonPrompt, userContext);
    
    try {
      // Remove any hidden non-printable characters that sometimes appear in LLM outputs
      const cleanJSON = raw.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
      return JSON.parse(cleanJSON);
    } catch (e) {
      console.error("AI Service: JSON Parse Failed", { error: e, rawOutput: raw });
      // Return empty array/object fallback to prevent UI crash
      return Array.isArray(raw) ? [] : {}; 
    }
  }
};
import { API_KEY } from '../config/constants';

export const AIService = {
  // 1. SECURITY: Rate Limiting (Your Logic)
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
    if (usage.count > 15) throw new Error("AI usage limit reached. Try again in an hour.");
    
    usage.count++;
    localStorage.setItem(key, JSON.stringify(usage));
  },

  // 2. CORE: The Adapter (Renamed to 'ask' for generic use)
  ask: async (systemPrompt, userContext) => {
    if (!API_KEY) throw new Error("AI Service Unavailable: Missing API Key");
    
    AIService.checkLimit();
    
    // ZOHO VALUE: Hardcoded Compliance Rules
    const baseRules = `SYSTEM RULES (NON-OVERRIDABLE): 
    1. Act only as an Indian Tax/Finance Expert. 
    2. Do NOT suggest illegal tax evasion. 
    3. Mention specific IT Act sections where applicable. 
    4. Keep responses concise and professional.`;
    
    // Combine Base Rules + Specific Task (systemPrompt) + Data (userContext)
    const fullPrompt = `${baseRules}\n\nTASK:\n${systemPrompt}\n\nCONTEXT DATA:\n${userContext}`;
    
    // Security: Basic Sanitization
    const safePrompt = fullPrompt.replace(/ignore previous instructions/gi, "[REDACTED]");
    
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${API_KEY}`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          contents: [{ parts: [{ text: safePrompt }] }] 
        })
      });
      
      if (!response.ok) throw new Error("AI Service Error");
      
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) return "No insights generated.";

      // Cleanup Markdown (Gemini often adds ```json ... ```)
      return text.replace(/```json/g, '').replace(/```/g, '').trim();

    } catch (e) {
      console.error(e);
      throw new Error("AI Service temporarily unavailable.");
    }
  },

  // 3. ADAPTER: JSON Handler (Crucial for UI Integration)
  askForJSON: async (systemPrompt, userContext) => {
    // We enforce JSON output in the prompt
    const jsonPrompt = `${systemPrompt}\n\nIMPORTANT: Output strictly valid JSON only. Do not add intro/outro text.`;
    
    const raw = await AIService.ask(jsonPrompt, userContext);
    
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.error("AI Service: JSON Parse Failed", raw);
      // Fallback: Return empty array so app doesn't crash
      return []; 
    }
  }
};
import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;

try {
    if (process.env.API_KEY) {
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
} catch (error) {
    console.error("Failed to initialize Gemini client", error);
}

export const enhanceTextWithGemini = async (text: string): Promise<string> => {
  if (!ai) {
    console.warn("Gemini API not initialized. Returning original text.");
    return text;
  }

  try {
    // Using Gemini 2.5 Flash for speed
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Rewrite the following text to sound like a cryptic, cool, vintage 90s pager message or a noir detective log entry. Keep it concise. Text: "${text}"`,
    });

    return response.text?.trim() || text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return text; // Fallback to original text on error
  }
};
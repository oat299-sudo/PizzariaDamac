
import { GoogleGenAI } from "@google/genai";
import { Pizza } from '../types';

let genAI: GoogleGenAI | null = null;

try {
  // Safe check for process.env to avoid "ReferenceError: process is not defined" in some browsers
  // We prioritize process.env.API_KEY as per guidelines, but safely.
  let apiKey = '';
  
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
    apiKey = process.env.API_KEY;
  } else {
    // Fallback for Vite environments if process is missing
    try {
       apiKey = (import.meta as any).env.VITE_GOOGLE_API_KEY || '';
    } catch (e) {}
  }

  if (apiKey) {
    genAI = new GoogleGenAI({ apiKey: apiKey });
  }
} catch (error) {
  console.error("Failed to initialize Gemini Client", error);
}

export const getPizzaRecommendation = async (
  userPreference: string,
  menu: Pizza[]
): Promise<string> => {
  if (!genAI) return "Sorry, our AI Chef is currently on break (API Key missing).";

  const menuString = menu.map(p => `${p.name} (${p.description})`).join(', ');

  try {
    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        You are an expert Italian Pizza Chef at "Pizza Damac".
        The customer asks: "${userPreference}".
        Here is our menu: ${menuString}.
        
        Recommend ONE pizza from the menu that best fits their request. 
        Explain why in a short, appetizing sentence (max 30 words).
        If the request is unrelated to food, strictly say "I can only recommend pizzas."
      `,
    });

    return response.text.trim();
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I couldn't come up with a recommendation right now. Try the Pizza Damac Special!";
  }
};

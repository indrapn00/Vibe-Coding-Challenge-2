
import { GoogleGenAI } from "@google/genai";
import { ProcessedLinkData } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const processUrl = async (url: string): Promise<ProcessedLinkData> => {
  const prompt = `Analyze the content of the following URL: ${url}. Based on its content, provide a concise one-paragraph summary, a suitable title for a bookmark, and a list of 3-5 relevant lowercase tags. Your entire response must be a single JSON object with the keys: 'title', 'summary', and 'tags' (an array of strings). Do not include any text or formatting outside of this JSON object.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    // Clean potential markdown formatting from the response
    const cleanedJson = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsedData = JSON.parse(cleanedJson);

    // Basic validation
    if (
        typeof parsedData.title === 'string' &&
        typeof parsedData.summary === 'string' &&
        Array.isArray(parsedData.tags) &&
        parsedData.tags.every((tag: any) => typeof tag === 'string')
    ) {
        return parsedData as ProcessedLinkData;
    } else {
        throw new Error("Invalid data structure received from API.");
    }

  } catch (error) {
    console.error("Error processing URL with Gemini:", error);
    throw new Error("Failed to analyze the link. The content might be inaccessible or the URL is invalid.");
  }
};

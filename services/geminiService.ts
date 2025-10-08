import { GoogleGenAI, Type } from "@google/genai";
import { ProcessedLinkData } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "A short, descriptive title for the link.",
    },
    summary: {
      type: Type.STRING,
      description: "A concise, single-paragraph summary of the article's content.",
    },
    tags: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
        description: "A relevant lowercase tag."
      },
      description: "An array of 3-5 relevant lowercase tags.",
    },
  },
  required: ["title", "summary", "tags"],
};

export const processUrl = async (url: string): Promise<ProcessedLinkData> => {
  const prompt = `Analyze the content of the following URL: ${url}. Based on its content, provide a concise one-paragraph summary, a suitable title for a bookmark, and a list of 3-5 relevant lowercase tags. Your entire response must be a single JSON object with the keys: 'title', 'summary', and 'tags' (an array of strings). Do not include any text or formatting outside of this JSON object.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const jsonText = response.text.trim();
    // Although responseMimeType is set, it's good practice to validate
    const parsedData = JSON.parse(jsonText);
    
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

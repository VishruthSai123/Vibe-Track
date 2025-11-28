import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';

// Initialize safely. 
// Note: In a real app, we'd handle missing keys more gracefully in the UI.
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const generateIssueDescription = async (title: string, type: string): Promise<string> => {
  if (!ai) throw new Error("API Key not found");

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are an expert product manager. Write a comprehensive and professional Jira ticket description for a "${type}" with the title: "${title}".
      Include sections for:
      - Context/Background
      - Acceptance Criteria (bullet points)
      - Technical Notes (if applicable)
      
      Format with Markdown. Keep it concise but detailed enough for a developer.`,
    });
    return response.text || "";
  } catch (error) {
    console.error("GenAI Error:", error);
    throw error;
  }
};

export const suggestSubtasks = async (description: string): Promise<string[]> => {
  if (!ai) throw new Error("API Key not found");

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Based on this ticket description, generate a list of 3-5 subtasks to complete this work. Return ONLY a JSON array of strings. No markdown formatting around the json.
      
      Description: ${description}`,
    });
    
    const text = response.text?.trim() || "[]";
    // Clean up potential markdown code blocks if the model ignores the prompt
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '');
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("GenAI Error:", error);
    return [];
  }
};

export const summarizeIssue = async (issueContent: string): Promise<string> => {
  if (!ai) throw new Error("API Key not found");

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Summarize the current state and key points of this issue history and description in 2 sentences for a quick status report:
      ${issueContent}`,
    });
    return response.text || "";
  } catch (error) {
    console.error("GenAI Error:", error);
    throw error;
  }
};
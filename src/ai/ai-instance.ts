// Minimal AI instance using Genkit shim and Google Vertex AI client
import { genkit } from '@/genkit-shim';
// Import the Vertex AI client (if needed for custom usage)
import { VertexAI } from '@google-cloud/vertexai';

// Example: initialize VertexAI client (optional, depends on your usage)
let vertexClient: VertexAI | null = null;
if (process.env.GOOGLE_GENAI_API_KEY) {
  vertexClient = new VertexAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY });
  console.log('[ai-instance] VertexAI client initialized.');
} else {
  console.warn('[ai-instance] GOOGLE_GENAI_API_KEY is not set. VertexAI client will not be available.');
}

// Export the AI instance using the shim's genkit function (no plugins required for now)
export const ai = genkit({
  promptDir: './prompts',
  plugins: [],
});

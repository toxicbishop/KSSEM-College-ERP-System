// Minimal AI instance using Genkit shim and Google Vertex AI client
import { genkit } from '@/genkit-shim';
// Import the Vertex AI client (if needed for custom usage)
// VertexAI client initialization removed – the current shim does not require a direct client.
// If needed later, instantiate with proper options (e.g., projectId, location) according to the @google-cloud/vertexai docs.


// Export the AI instance using the shim's genkit function (no plugins required for now)
export const ai = genkit({
  promptDir: './prompts',
  plugins: [],
});

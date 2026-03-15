
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const genkitPlugins = [];

if (process.env.GOOGLE_GENAI_API_KEY) {
  genkitPlugins.push(googleAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY,
    // You can specify a default model for text generation here if desired
    // defaultModel: 'gemini-1.5-flash-latest',
  }));
  console.log('[ai-instance] Google AI plugin configured with API key.');
} else {
  console.warn('[ai-instance] GOOGLE_GENAI_API_KEY is not set. Google AI plugin will not be available. Genkit features requiring this plugin may fail if called.');
}

export const ai = genkit({
  promptDir: './prompts', // This might not be used if prompts are defined inline
  plugins: genkitPlugins,
  // Plugins provided above. Avoid specifying unknown options not present in GenkitOptions.
});

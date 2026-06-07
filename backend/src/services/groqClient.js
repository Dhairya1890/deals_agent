import 'dotenv/config';
import Groq from 'groq-sdk';

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'gemma2-9b-it',
];

export async function groqComplete({ messages, system, max_tokens = 1024 }) {
  const fullMessages = system
    ? [{ role: 'system', content: system }, ...messages]
    : messages;

  let lastError;
  for (const model of MODELS) {
    try {
      const response = await client.chat.completions.create({
        model,
        messages: fullMessages,
        max_tokens,
      });
      return response.choices[0].message.content;
    } catch (err) {
      lastError = err;
      console.warn(`Groq model ${model} failed: ${err.message} — trying next`);
    }
  }

  throw new Error(`All Groq models failed. Last error: ${lastError?.message}`);
}

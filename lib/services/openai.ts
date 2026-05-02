import OpenAI from 'openai';
import { z } from 'zod';

export class OpenAIService {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey: apiKey,
    });
  }

  async generateStructuredOutput<T>(params: {
    systemPrompt: string;
    userPrompt: string;
    schema: Record<string, any>;
    model?: string;
  }): Promise<T> {
    let retries = 3;
    let lastError: any;

    while (retries > 0) {
      try {
        const response = await this.client.chat.completions.create({
          model: params.model || 'gpt-4o-mini',
          messages: [
            { role: 'system', content: params.systemPrompt },
            { role: 'user', content: params.userPrompt },
          ],
          response_format: { type: 'json_object' },
        });

        const content = response.choices[0].message.content;
        if (!content) throw new Error('OpenAI returned empty content');
        
        return JSON.parse(content) as T;
      } catch (error: any) {
        lastError = error;
        if (error?.status === 429 || error?.status >= 500) {
          console.warn(`[OpenAI] Transient error (${error.status}). Retrying... (${retries} left)`);
          retries--;
          await new Promise(resolve => setTimeout(resolve, 2000 * (3 - retries))); // Exponential backoff
          continue;
        }
        throw error; // Non-transient error
      }
    }

    throw lastError;
  }
}

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `[Config] Missing required environment variable: "${key}". ` +
      `Check your .env.local file and deployment environment settings.`
    );
  }
  return value;
}

export const openAIService = new OpenAIService(requireEnv('OPENAI_API_KEY'));

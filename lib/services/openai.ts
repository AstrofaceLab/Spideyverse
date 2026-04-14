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
  }
}

export const openAIService = new OpenAIService(process.env.OPENAI_API_KEY || '');

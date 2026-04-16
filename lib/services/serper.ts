/**
 * Serper.dev Google Search API Service for Lead Discovery
 */

export interface SerperResult {
  title: string;
  link: string;
  snippet: string;
  position?: number;
  date?: string;
  source?: string;
}

export class SerperService {
  private apiKey: string;
  private baseUrl = 'https://google.serper.dev/search';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async search(query: string, num: number = 10): Promise<SerperResult[]> {
    if (!this.apiKey) {
      throw new Error('SERPER_API_KEY is not set');
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'X-API-KEY': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: query,
          num: num,
        }),
      });

      if (!response.ok) {
        throw new Error(`Serper API error: ${response.status}`);
      }

      const data = await response.json();
      return (data.organic || []) as SerperResult[];
    } catch (error) {
      console.error('Serper Search Error:', error);
      throw error;
    }
  }
}

export const serperService = new SerperService(process.env.SERPER_API_KEY || '');


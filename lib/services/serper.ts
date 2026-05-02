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

  /**
   * Executes a Google search via Serper and returns organic results.
   */
  async search(query: string, limit: number = 10): Promise<SerperResult[]> {
    if (!this.apiKey) {
      console.error('[SerperService] SERPER_API_KEY is missing in environment.');
      throw new Error('SERPER_API_KEY is not set');
    }

    console.log(`[SerperService] Searching for query: "${query}" (limit: ${limit})`);

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'X-API-KEY': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: query,
          num: limit,
        }),
        // Ensure we don't hang forever
        signal: AbortSignal.timeout(15000) 
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`[SerperService] API Error (${response.status}):`, errorBody);
        throw new Error(`Serper API error: ${response.status}`);
      }

      const data = await response.json();
      const results = (data.organic || []).map((res: any) => ({
        title: res.title,
        link: res.link,
        snippet: res.snippet,
        position: res.position,
        source: res.source
      })) as SerperResult[];

      console.log(`[SerperService] Found ${results.length} organic results.`);
      return results;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error('[SerperService] Search timed out.');
      } else {
        console.error('[SerperService] Search Failed:', error.message);
      }
      return []; // Return empty instead of throwing to keep the pipeline moving
    }
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

export const serperService = new SerperService(requireEnv('SERPER_API_KEY'));



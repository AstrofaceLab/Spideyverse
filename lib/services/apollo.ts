/**
 * Apollo Mixed People Search API Service
 */

interface ApolloSearchParams {
  q_keywords?: string;
  q_organization_keyword_tags?: string[];
  person_titles?: string[];
  locations?: string[];
  num_results?: number;
}

export class ApolloService {
  private apiKey: string;
  private baseUrl = 'https://api.apollo.io/api/v1/people/search';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async searchPeople(params: ApolloSearchParams) {
    if (!this.apiKey) {
      throw new Error('APOLLO_API_KEY is not set');
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'X-Api-Key': this.apiKey,
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Apollo API error: ${response.status} ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Apollo Search Error:', error);
      throw error;
    }
  }

  /**
   * Maps campaign context to Apollo search parameters
   */
  mapCampaignToSearchParams(context: {
    niche: string;
    business_type: string;
    target_region: string;
    ideal_lead_profile: string;
  }): ApolloSearchParams {
    // Basic mapping logic
    // ideal_lead_profile often contains titles like "CEO", "Founder"
    const titles = context.ideal_lead_profile
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    return {
      q_keywords: `${context.niche} ${context.business_type}`,
      person_titles: titles.length > 0 ? titles : undefined,
      locations: [context.target_region],
      num_results: 50, // Default limit
    };
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

export const apolloService = new ApolloService(requireEnv('APOLLO_API_KEY'));

import { openAIService } from './openai';

export interface CampaignContext {
  niche: string;
  target_region: string;
  ideal_lead_profile: string;
  offer?: string;
}

export class QueryGenerator {
  async generateQueries(context: CampaignContext): Promise<string[]> {
    try {
      const result = await openAIService.generateStructuredOutput<{ queries: string[] }>({
        systemPrompt: `You are an expert search string engineer for lead generation.
Generate 5-10 high-intent Google search queries to find potential leads based on the user's business context.
Focus on finding company websites, contact pages, or LinkedIn profiles.
Include queries that target specific regions and niches.`,
        userPrompt: `Niche: ${context.niche}
Region: ${context.target_region}
ICP: ${context.ideal_lead_profile}
Offer: ${context.offer || 'Not specified'}

Output 5-10 precise queries in a JSON array under the key 'queries'.`,
        schema: {
          type: "object",
          properties: {
            queries: {
              type: "array",
              items: { type: "string" }
            }
          },
          required: ["queries"]
        }
      });

      return result.queries || [];
    } catch (error) {
      console.error('Query Generation Error:', error);
      // Fallback queries
      return [
        `${context.niche} companies in ${context.target_region}`,
        `${context.niche} services contact ${context.target_region}`,
        `${context.ideal_lead_profile} ${context.niche} ${context.target_region}`
      ];
    }
  }
}

export const queryGenerator = new QueryGenerator();

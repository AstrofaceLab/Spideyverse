import { openAIService } from './openai';

export interface CampaignContext {
  niche: string;
  target_region: string;
  ideal_lead_profile: string;
  offer?: string;
}

/**
 * Production-grade query engineer for lead discovery via Serper/Google.
 */
export class QueryGenerator {
  async generateQueries(context: CampaignContext): Promise<string[]> {
    console.log(`[QueryGenerator] Engineering search strings for niche: ${context.niche}`);
    
    try {
      const result = await openAIService.generateStructuredOutput<{ queries: string[] }>({
        systemPrompt: `You are a Senior Search Engineer specialized in B2B lead generation and OSINT discovery.
Your goal is to generate 5-10 highly targeted Google search queries that uncover prospects' websites, LinkedIn profiles, and contact information.

STRATEGIES:
1. **Direct Discovery**: Target the niche and region directly.
2. **Contact Hunting**: Use operators like 'inurl:contact' or 'intitle:"contact us"'.
3. **LinkedIn Sourcing**: Target profiles on LinkedIn (site:linkedin.com/in).
4. **Competitor/Directory**: Look for lists or directories of companies in the niche.
5. **Pain Point/Offer**: Search for forums or discussions where target leads hang out.

OPERATORS TO USE:
- site: (e.g., site:linkedin.com/in or site:instagram.com)
- inurl: (e.g., inurl:contact or inurl:team)
- intitle: (e.g., intitle:"get in touch")
- quotation marks for exact matches.

Output strictly in JSON format with a 'queries' array.`,
        userPrompt: `BUSINESS CONTEXT:
- Niche/Industry: ${context.niche}
- Target Region: ${context.target_region}
- Ideal Customer Profile (ICP): ${context.ideal_lead_profile}
- The Offer: ${context.offer || 'Not specified'}

Generate 10 precise, high-intent search strings. Avoid generic queries. Diversify the strategies.`,
        schema: {
          type: "object",
          properties: {
            queries: {
              type: "array",
              minItems: 5,
              maxItems: 10,
              items: { 
                type: "string",
                description: "A Google search query using advanced operators where appropriate."
              }
            }
          },
          required: ["queries"]
        }
      });

      const queries = result.queries || [];
      console.log(`[QueryGenerator] Successfully engineered ${queries.length} queries.`);
      return queries;
    } catch (error) {
      console.error('[QueryGenerator] Error:', error);
      // Robust Fallback Logic
      return [
        `"${context.niche}" companies in ${context.target_region} site:linkedin.com`,
        `intitle:"contact us" "${context.niche}" ${context.target_region}`,
        `"${context.ideal_lead_profile}" ${context.niche} ${context.target_region}`,
        `inurl:contact "${context.niche}" ${context.target_region}`,
        `list of ${context.niche} companies in ${context.target_region}`
      ];
    }
  }
}

export const queryGenerator = new QueryGenerator();


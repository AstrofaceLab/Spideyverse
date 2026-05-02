import { openAIService } from './openai';
import { z } from 'zod';
import * as cheerio from 'cheerio';
import { firecrawlService } from './firecrawl';

/**
 * Strict Zod Validation Schema for Leads
 */
export const LeadExtractionSchema = z.object({
  company_name: z.string().optional(),
  contact_name: z.string().optional(),
  role: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  summary: z.string().optional(),
  industry_hint: z.string().optional(),
});

export type ExtractedLead = z.infer<typeof LeadExtractionSchema>;

export class DataExtractor {
  /**
   * Simple HTML/Text scraper for emails
   */
  private extractEmails(html: string): string[] {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    return Array.from(new Set(html.match(emailRegex) || []));
  }

  /**
   * Clean and normalize text for AI processing
   */
  private cleanText(text: string): string {
    return text
      .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, ' ')
      .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi, ' ')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 6000); 
  }

  /**
   * Use AI to extract structured data from raw content
   */
  async extractLeadWithAI(content: string, sourceUrl: string): Promise<ExtractedLead | null> {
    const cleanedContent = this.cleanText(content);
    
    try {
      const result = await openAIService.generateStructuredOutput<any>({
        systemPrompt: `You are a professional lead extraction agent. 
Extract lead information from the provided web content. 
Focus on identifying the primary contact person if possible.
If information is missing, use null or omit it. 
Be precise and avoid guessing.`,
        userPrompt: `Source URL: ${sourceUrl}\n\nContent:\n${cleanedContent}`,
        schema: {
          type: "object",
          properties: {
            company_name: { type: "string" },
            contact_name: { type: "string" },
            role: { type: "string" },
            email: { type: "string", format: "email" },
            website: { type: "string", format: "uri" },
            summary: { type: "string", description: "Brief description of the company/prospect." },
            industry_hint: { type: "string" }
          }
        }
      });

      // Zod Validation
      const validated = LeadExtractionSchema.safeParse(result);
      if (!validated.success) {
        console.warn('[DataExtractor] Zod Validation Failed:', validated.error.format());
        return result as ExtractedLead; // Fallback to raw if logic allows, but safer to return partial
      }
      
      return validated.data;
    } catch (error) {
      console.error('[DataExtractor] AI Extraction Error:', error);
      return null;
    }
  }

  /**
   * Main entry point
   */
  async processUrl(url: string): Promise<ExtractedLead | null> {
    console.log(`[DataExtractor] Processing ${url}...`);
    try {
      // 🚀 Stage 2: Firecrawl Intelligence
      let content: string | null = null;
      
      const firecrawlContent = await firecrawlService.scrapeUrl(url);
      if (firecrawlContent) {
        console.log(`[DataExtractor] Successfully scraped via Firecrawl: ${url.slice(0, 30)}...`);
        content = firecrawlContent;
      } else {
        console.log(`[DataExtractor] Firecrawl failed/missing, falling back to basic fetch: ${url}`);
        const response = await fetch(url, { 
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Spideyverse/1.0' },
          signal: AbortSignal.timeout(12000) 
        });
        
        if (response.ok) {
          content = await response.text();
        }
      }
      
      if (!content) return null;

      const extractedEmails = this.extractEmails(content);
      const aiResult = await this.extractLeadWithAI(content, url);
      
      if (!aiResult) return null;

      // Final normalization
      return {
        ...aiResult,
        email: aiResult.email || (extractedEmails.length > 0 ? extractedEmails[0] : undefined),
        website: aiResult.website || url
      };
    } catch (e: any) {
      console.error(`[DataExtractor] Critical Failure for ${url}:`, e.message);
      return null;
    }
  }
}

export const dataExtractor = new DataExtractor();



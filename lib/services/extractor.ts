import { openAIService } from './openai';
import { z } from 'zod';

export const LeadExtractionSchema = z.object({
  company_name: z.string().optional(),
  contact_name: z.string().optional(),
  contact_role: z.string().optional(),
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
  extractEmails(text: string): string[] {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    return Array.from(new Set(text.match(emailRegex) || []));
  }

  /**
   * Clean and normalize text for AI processing
   */
  private cleanText(text: string): string {
    return text
      .replace(/<[^>]*>/g, ' ') // Remove HTML tags
      .replace(/\s+/g, ' ')     // Normalize whitespace
      .trim()
      .slice(0, 5000);          // Truncate to avoid token limits
  }

  /**
   * Use AI to extract structured data from raw content
   */
  async extractLeadWithAI(content: string, sourceUrl: string): Promise<ExtractedLead | null> {
    const cleanedContent = this.cleanText(content);
    
    try {
      const result = await openAIService.generateStructuredOutput<ExtractedLead>({
        systemPrompt: `You are a professional lead extraction agent. 
Extract lead information from the provided web content. 
If information is missing, use null or omit it. 
Be precise and avoid guessing.`,
        userPrompt: `Source URL: ${sourceUrl}\n\nContent:\n${cleanedContent}`,
        schema: {
          type: "object",
          properties: {
            company_name: { type: "string" },
            contact_name: { type: "string" },
            contact_role: { type: "string" },
            email: { type: "string", format: "email" },
            website: { type: "string", format: "uri" },
            summary: { type: "string" },
            industry_hint: { type: "string" }
          }
        }
      });

      // Basic validation post-extraction
      if (!result.company_name && !result.contact_name) return null;
      
      return result;
    } catch (error) {
      console.error('AI Extraction Error:', error);
      return null;
    }
  }

  /**
   * Fetches content and extracts info
   */
  async processUrl(url: string): Promise<ExtractedLead | null> {
    try {
      const response = await fetch(url, { 
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Spideyverse/1.0' },
        signal: AbortSignal.timeout(10000) // 10s timeout
      });
      
      if (!response.ok) return null;
      
      const html = await response.text();
      const extractedEmails = this.extractEmails(html);
      
      const aiResult = await this.extractLeadWithAI(html, url);
      
      if (aiResult) {
        // Prioritize found email if AI didn't find one or if we found multiple
        if (!aiResult.email && extractedEmails.length > 0) {
          aiResult.email = extractedEmails[0];
        }
        if (!aiResult.website) {
           aiResult.website = url;
        }
      }
      
      return aiResult;
    } catch (e) {
      console.error(`Scraping failed for ${url}:`, e);
      return null;
    }
  }
}

export const dataExtractor = new DataExtractor();

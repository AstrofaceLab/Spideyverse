import { serperService } from '../serper';
import { createAdminClient } from '../../supabase/admin';
import { queryGenerator } from '../query-generator';
import { dataExtractor } from '../extractor';

export interface ResearchInput {
  campaignId: string;
  workspaceId: string;
  niche: string;
  businessType: string;
  targetRegion: string;
  idealLeadProfile: string;
  offerContext?: string;
}

export class ResearchAgent {
  private supabase = createAdminClient();

  async run(input: ResearchInput) {
    console.log(`[ResearchAgent] Starting for campaign ${input.campaignId}`);
    
    // 1. Generate high-intent queries
    const queries = await queryGenerator.generateQueries({
      niche: input.niche,
      target_region: input.targetRegion,
      ideal_lead_profile: input.idealLeadProfile,
      offer: input.offerContext
    });

    const allLeads: any[] = [];
    const processedUrls = new Set<string>();

    // 2. Execute searches (Batch processing)
    for (const query of queries) {
      try {
        const results = await serperService.search(query, 10);
        
        for (const result of results) {
          if (processedUrls.has(result.link)) continue;
          processedUrls.add(result.link);

          // 3. Extract data from each result
          // We limit the number of leads per run to ~20-50 as requested
          if (allLeads.length >= 30) break; 

          const extractedLead = await dataExtractor.processUrl(result.link);
          
          if (extractedLead) {
            allLeads.push({
              campaign_id: input.campaignId,
              workspace_id: input.workspaceId,
              company_name: extractedLead.company_name || result.title.split('-')[0].trim(),
              company_website: extractedLead.website || result.link,
              contact_name: extractedLead.contact_name,
              contact_role: extractedLead.contact_role,
              email: extractedLead.email,
              source: 'serper',
              source_url: result.link,
              summary: extractedLead.summary || result.snippet,
              qualification_status: 'new',
              tags: extractedLead.industry_hint ? [extractedLead.industry_hint] : [],
              score: null,
            });
          } else {
            // Fallback to basic info if extraction failed but we have a result
            allLeads.push({
              campaign_id: input.campaignId,
              workspace_id: input.workspaceId,
              company_name: result.title.split('-')[0].trim(),
              company_website: result.link,
              source: 'serper',
              source_url: result.link,
              summary: result.snippet,
              qualification_status: 'new',
              score: null,
            });
          }
        }
        if (allLeads.length >= 30) break;
      } catch (err) {
        console.error(`Search failed for query "${query}":`, err);
      }
    }

    // 4. Deduplication by email or (company_name + website)
    const uniqueLeads = this.deduplicateLeads(allLeads);

    // 5. Persist to DB
    if (uniqueLeads.length > 0) {
      const { error } = await this.supabase.from('leads').insert(uniqueLeads);
      if (error) {
        console.error('[ResearchAgent] Error inserting leads:', error);
        throw new Error(`Failed to save discovered leads: ${error.message}`);
      }
    }

    const emailCount = uniqueLeads.filter(l => !!l.email).length;

    return {
      leadsFound: uniqueLeads.length,
      emailCount,
      extractionSuccessRate: uniqueLeads.length > 0 ? (emailCount / uniqueLeads.length) * 100 : 0,
      source: 'serper',
    };
  }

  private deduplicateLeads(leads: any[]): any[] {
    const seenEmails = new Set();
    const seenEntities = new Set();
    const result: any[] = [];

    for (const lead of leads) {
      if (lead.email) {
        if (seenEmails.has(lead.email.toLowerCase())) continue;
        seenEmails.add(lead.email.toLowerCase());
      } else {
        const entityKey = `${lead.company_name?.toLowerCase()}-${lead.company_website?.toLowerCase()}`;
        if (seenEntities.has(entityKey)) continue;
        seenEntities.add(entityKey);
      }
      result.push(lead);
    }

    return result;
  }
}


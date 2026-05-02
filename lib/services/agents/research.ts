import { serperService } from '../serper';
import { createAdminClient } from '../../supabase/admin';
import { queryGenerator } from '../query-generator';
import { dataExtractor } from '../extractor';
import { apolloService } from '../apollo';

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

  /**
   * Step 1: Query Engineering
   */
  async generateQueries(input: ResearchInput): Promise<string[]> {
    return await queryGenerator.generateQueries({
      niche: input.niche,
      target_region: input.targetRegion,
      ideal_lead_profile: input.idealLeadProfile,
      offer: input.offerContext
    });
  }

  /**
   * Step 2a: Apollo Discovery execution (Deep B2B Data)
   */
  async discoverViaApollo(input: ResearchInput): Promise<any[]> {
    console.log(`[ResearchAgent] Launching Apollo intelligence gathering...`);
    const params = apolloService.mapCampaignToSearchParams({
      niche: input.niche,
      business_type: input.businessType,
      target_region: input.targetRegion,
      ideal_lead_profile: input.idealLeadProfile
    });

    try {
      const result = await apolloService.searchPeople(params);
      const people = result.people || [];
      console.log(`[ResearchAgent] Apollo found ${people.length} pre-qualified leads.`);
      
      return people.map((p: any) => ({
        campaign_id: input.campaignId,
        workspace_id: input.workspaceId,
        company_name: p.organization?.name || 'Unknown',
        company_website: p.organization?.primary_domain || p.organization?.website_url,
        contact_name: p.name,
        contact_role: p.title,
        email: p.email,
        source: 'apollo',
        summary: `Apollo verified ${p.title} at ${p.organization?.name}. Located in ${p.city}, ${p.state}.`,
        qualification_status: 'new',
        tags: [p.organization?.industry || 'B2B'],
        score: 80, // Pre-scored higher because it's from a verified B2B source
      }));
    } catch (err: any) {
      console.error(`[ResearchAgent] Apollo stage failed:`, err.message);
      return [];
    }
  }

  /**
   * Step 2b: Serper Search execution (Web-scale Discovery)
   */
  async executeSearch(queries: string[]): Promise<any[]> {
    const allResults = [];
    console.log(`[ResearchAgent] Starting search for ${queries.length} queries`);
    for (const query of queries) {
      try {
        const results = await serperService.search(query, 12);
        console.log(`[ResearchAgent] Query "${query}" returned ${results.length} results`);
        allResults.push(...results);
      } catch (err: any) {
        console.error(`[ResearchAgent] Query failed: ${query}`, err.message);
      }
    }
    console.log(`[ResearchAgent] Total results found: ${allResults.length}`);
    return allResults;
  }

  /**
   * Step 3: Scraping & Extraction
   */
  async extractLeads(searchResults: any[], campaignId: string, workspaceId: string): Promise<{ leads: any[], scannedCount: number }> {
    const rawLeads = [];
    const processedUrls = new Set<string>();
    let scannedCount = 0;

    console.log(`[ResearchAgent] Extracting leads from ${searchResults.length} results`);

    for (const result of searchResults) {
      if (processedUrls.has(result.link)) continue;
      processedUrls.add(result.link);
      scannedCount++;
      
      if (rawLeads.length >= 50) {
        console.log(`[ResearchAgent] Reached raw lead limit (50)`);
        break; // Limit raw pool
      }

      console.log(`[ResearchAgent] Processing URL (${scannedCount}/${searchResults.length}): ${result.link}`);
      const extracted = await dataExtractor.processUrl(result.link);
      if (extracted) {
        console.log(`[ResearchAgent] Successfully extracted: ${extracted.company_name}`);
        rawLeads.push({
          campaign_id: campaignId,
          workspace_id: workspaceId,
          company_name: extracted.company_name || result.title.split('-')[0].trim(),
          company_website: extracted.website || result.link,
          contact_name: extracted.contact_name || null,
          contact_role: extracted.role || null, // Map 'role' to 'contact_role'
          email: extracted.email || null,
          source: 'serper',
          summary: extracted.summary || result.snippet,
          qualification_status: 'new',
          tags: extracted.industry_hint ? [extracted.industry_hint] : [],
          score: null,
        });
      } else {
        console.log(`[ResearchAgent] Extraction failed for ${result.link}, using fallback.`);
        // Fallback to basic info from search result
        rawLeads.push({
          campaign_id: campaignId,
          workspace_id: workspaceId,
          company_name: result.title.split('-')[0].trim(),
          company_website: result.link,
          source: 'serper',
          summary: result.snippet,
          qualification_status: 'new',
          tags: [],
          score: null,
        });
      }
    }
    console.log(`[ResearchAgent] Extraction complete. Generated ${rawLeads.length} raw leads.`);
    return { leads: rawLeads, scannedCount };
  }


  /**
   * Step 4: Normalization & Global Deduplication
   */
  async normalizeAndPersist(rawLeads: any[]): Promise<any> {
    const batchUnique = this.deduplicateLeads(rawLeads);
    const finalLeads = [];
    
    // Global DB Check (Simplified for performance in this demo/phase)
    for (const lead of batchUnique) {
      const { data: exists } = await this.supabase
        .from('leads')
        .select('id')
        .eq('company_website', lead.company_website)
        .maybeSingle();
      
      if (!exists) finalLeads.push(lead);
    }

    if (finalLeads.length > 0) {
      const { error } = await this.supabase.from('leads').insert(finalLeads);
      if (error) throw error;
    }

    return {
      leadsFound: finalLeads.length,
      emailCount: finalLeads.filter(l => !!l.email).length
    };
  }

  private deduplicateLeads(leads: any[]): any[] {
    const seenEmails = new Set();
    const seenEntities = new Set();
    const result: any[] = [];

    for (const lead of leads) {
      if (lead.email) {
        const email = lead.email.toLowerCase().trim();
        if (seenEmails.has(email)) continue;
        seenEmails.add(email);
      } else {
        const entityKey = `${lead.company_name?.toLowerCase().trim()}-${lead.company_website?.toLowerCase().trim()}`;
        if (seenEntities.has(entityKey)) continue;
        seenEntities.add(entityKey);
      }
      result.push(lead);
    }

    return result;
  }
}

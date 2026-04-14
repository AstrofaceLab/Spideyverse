import { serperService } from '../serper';
import { createAdminClient } from '../../supabase/admin';

export interface ResearchInput {
  campaignId: string;
  workspaceId: string;
  niche: string;
  businessType: string;
  targetRegion: string;
  idealLeadProfile: string;
}

export class ResearchAgent {
  async run(input: ResearchInput) {
    console.log(`[ResearchAgent] Starting for campaign ${input.campaignId} (using Serper)`);
    
    // 1. Build search query
    const query = serperService.buildLeadQuery(
      input.niche,
      input.targetRegion,
      input.idealLeadProfile
    );

    // 2. Call Serper
    const organicResults = await serperService.searchLeads(query);
    
    // 3. Normalize and persist leads
    const supabase = createAdminClient();
    const leads = organicResults.map((result: any) => {
      // Basic extraction from snippet/title
      // Serper results for LinkedIn usually look like "Name - Title - Company | LinkedIn"
      const titleParts = result.title.split(' - ');
      const name = titleParts[0] || 'Prospect';
      const role = titleParts[1] || input.idealLeadProfile;
      
      return {
        campaign_id: input.campaignId,
        workspace_id: input.workspaceId,
        company_name: result.snippet.split(' at ')[1]?.split(' ')[0] || 'Company',
        company_website: result.link, // using LinkedIn as proxy
        contact_name: name,
        contact_role: role,
        email: 'prospect@example.com', // Serper doesn't provide email, Qualification/Outreach will handle this
        linkedin_url: result.link,
        source: 'Serper LinkedIn Search',
        source_provider: 'serper',
        summary: result.snippet,
        qualification_status: 'new',
      };
    });

    if (leads.length > 0) {
      const { error } = await supabase.from('leads').insert(leads);
      if (error) throw error;
    }

    return {
      leadsFound: leads.length,
      firstLeadId: leads.length > 0 ? (await supabase.from('leads').select('id').eq('campaign_id', input.campaignId).limit(1).single() as any).data?.id : null,
      source: 'serper',
    };
  }
}

/**
 * Firecrawl Service
 * Specialized scraping for AI agents - returns clean markdown and bypasses anti-bot.
 */

export class FirecrawlService {
  private apiKey: string;
  private baseUrl = 'https://api.firecrawl.dev/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Scrapes a URL and returns structured content / markdown
   */
  async scrapeUrl(url: string) {
    if (!this.apiKey) {
      console.warn('[Firecrawl] API Key missing. Falling back to basic fetch.');
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          url: url,
          formats: ['markdown'],
          onlyMainContent: true
        })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        console.error('[Firecrawl] API Error:', response.status, err);
        return null;
      }

      const result = await response.json();
      return result.data?.markdown || result.data?.content || null;
    } catch (error: any) {
      console.error('[Firecrawl] Fetch Failed:', error.message);
      return null;
    }
  }
}

// Firecrawl is optional — the extractor falls back to basic fetch if missing.
// Setting FIRECRAWL_API_KEY enables anti-bot scraping for higher data quality.
const firecrawlApiKey = process.env.FIRECRAWL_API_KEY || '';
if (!firecrawlApiKey) {
  console.warn(
    '[Config] FIRECRAWL_API_KEY is not set. DataExtractor will use basic fetch ' +
    '(lower scraping success rate). Set this key in .env.local to enable full scraping.'
  );
}

export const firecrawlService = new FirecrawlService(firecrawlApiKey);

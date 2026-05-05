/**
 * Resend Email Service
 * Handles actual delivery of outreach messages.
 */

export class ResendService {
  private apiKey: string;
  private baseUrl = 'https://api.resend.com';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async sendEmail(params: {
    to: string;
    subject: string;
    text: string;
    from?: string;
  }) {
    if (!this.apiKey) {
      console.log(`[Resend] MOCK MODE: Sending email to ${params.to} | Subject: ${params.subject}`);
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      return { id: `mock_${Math.random().toString(36).substr(2, 9)}` };
    }

    try {
      const response = await fetch(`${this.baseUrl}/emails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          from: params.from || 'Spideyverse Outreach <outreach@spideyverse.ai>',
          to: [params.to],
          subject: params.subject,
          text: params.text
        })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(`Resend API error: ${response.status} ${JSON.stringify(err)}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('[Resend] Delivery Failed:', error.message);
      throw error;
    }
  }
}

// Validate Resend configuration at startup
const resendApiKey = process.env.RESEND_API_KEY || '';
if (!resendApiKey) {
  console.warn(
    '[Config] RESEND_API_KEY is not set. ResendService will run in MOCK MODE — ' +
    'emails will be logged but not delivered. Set this key to enable real sending.'
  );
} else if (!process.env.RESEND_FROM_EMAIL) {
  console.warn(
    '[Config] RESEND_FROM_EMAIL is not set. ResendService will run in MOCK MODE. ' +
    'This must be a Resend-verified sender email to enable real sending.'
  );
}

export const resendService = new ResendService(resendApiKey);

import { NextRequest, NextResponse } from 'next/server';
import { getRealCampaignOrchestration } from '@/lib/services/workflow-queries';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orch = await getRealCampaignOrchestration(params.id);
    return NextResponse.json(orch);
  } catch (error: any) {
    console.error('Orchestration Fetch Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

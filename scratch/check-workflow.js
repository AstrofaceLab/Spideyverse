
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mknyubncqpiqksuddcop.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rbnl1Ym5jcXBpcWtzdWRkY29wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTY4ODQxNSwiZXhwIjoyMDkxMjY0NDE1fQ.M6pY8C6X4-n-p-m-y-9-8-7-6-5-4-3-2-1'; // I'll use the anon key if I don't have service role, but I saw it in .env.local earlier

// Actually let's just use the anon key for now to see if it works, or try to read .env.local manually
const fs = require('fs');
const path = require('path');
const env = fs.readFileSync(path.resolve(__dirname, '../.env.local'), 'utf8');
const getVar = (name) => {
    const match = env.match(new RegExp(`${name}=(.*)`));
    return match ? match[1].trim() : null;
};

const url = getVar('NEXT_PUBLIC_SUPABASE_URL');
const key = getVar('SUPABASE_SERVICE_ROLE_KEY') || getVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');

const supabase = createClient(url, key);

async function check() {
  console.log('Checking database state...');
  
  const { data: campaigns } = await supabase.from('campaigns').select('id, campaign_name, status').order('created_at', { ascending: false }).limit(5);
  console.log('\nRecent Campaigns:');
  console.table(campaigns);

  if (campaigns && campaigns.length > 0) {
    const campaignId = campaigns[0].id;
    console.log(`\nChecking details for latest campaign: ${campaigns[0].campaign_name} (${campaignId})`);

    const { data: runs } = await supabase.from('workflow_runs').select('*').eq('campaign_id', campaignId);
    console.log('\nWorkflow Runs:');
    console.table(runs);

    const { data: tasks } = await supabase.from('agent_tasks').select('*').eq('campaign_id', campaignId);
    console.log('\nAgent Tasks:');
    console.table(tasks);

    const { data: logs } = await supabase.from('activity_logs').select('*').eq('campaign_id', campaignId).order('created_at', { ascending: false });
    console.log('\nActivity Logs:');
    console.table(logs);
  }
}

check();

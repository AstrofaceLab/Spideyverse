const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(__dirname, '../.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  envContent.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value) {
      env[key.trim()] = value.join('=').trim();
    }
  });
  return env;
}

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('--- Checking Supabase Database ---');

  const { data: campaigns } = await supabase.from('campaigns').select('*').order('created_at', { ascending: false }).limit(5);
  console.log('\nRecent Campaigns:');
  console.table(campaigns?.map(c => ({ 
    id: c.id, 
    name: c.campaign_name, 
    status: c.status, 
    stage: c.current_stage,
    created: c.created_at 
  })));

  const { data: runs } = await supabase.from('workflow_runs').select('*').order('created_at', { ascending: false }).limit(5);
  console.log('\nRecent Workflow Runs:');
  console.table(runs?.map(r => ({ 
    id: r.id, 
    campaign: r.campaign_id, 
    status: r.status, 
    stage: r.current_stage 
  })));

  const { data: tasks } = await supabase.from('agent_tasks').select('*').order('created_at', { ascending: false }).limit(10);
  console.log('\nRecent Agent Tasks:');
  console.table(tasks?.map(t => ({ 
    id: t.id, 
    agent: t.agent_name, 
    stage: t.stage, 
    status: t.status 
  })));

  const { data: leads } = await supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(10);
  console.log('\nRecent Leads:');
  console.table(leads?.map(l => ({ 
    id: l.id, 
    company: l.company_name, 
    name: l.contact_name, 
    status: l.qualification_status 
  })));

  const { data: logs } = await supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(10);
  console.log('\nRecent Activity Logs:');
  logs?.forEach(log => console.log(`[${log.created_at}] ${log.event_type}: ${log.message}`));
}

checkDatabase().catch(console.error);

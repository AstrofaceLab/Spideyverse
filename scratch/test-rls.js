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

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLS() {
  console.log('--- Checking RLS Policies ---');
  const { data, error } = await supabase.rpc('get_policies_summary');
  
  if (error) {
    // Fallback: use raw query if RPC doesn't exist
    const { data: policies, error: queryError } = await supabase.from('pg_policies').select('*');
    if (queryError) {
      console.log('Could not check policies directly. Trying to just run a test insert.');
      return;
    }
    console.table(policies);
  } else {
    console.table(data);
  }
}

async function testInsert() {
  console.log('\n--- Testing Anon Insert into workflow_runs ---');
  const anonClient = createClient(supabaseUrl, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  
  // Get a valid campaign and workspace id
  const { data: campaign } = await supabase.from('campaigns').select('id, workspace_id').limit(1).single();
  
  if (!campaign) {
    console.log('No campaign found to test with.');
    return;
  }

  const { error } = await anonClient.from('workflow_runs').insert({
    campaign_id: campaign.id,
    workspace_id: campaign.workspace_id,
    status: 'running',
    current_stage: 'research'
  });

  if (error) {
    console.error('Anon Insert Failed:', error.message);
  } else {
    console.log('Anon Insert Succeeded! RLS might be wide open or policies are correctly set.');
  }
}

checkRLS().then(testInsert).catch(console.error);

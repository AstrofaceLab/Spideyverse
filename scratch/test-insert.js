
const { createClient } = require('@supabase/supabase-js');
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

async function checkSchema() {
  console.log('Testing insert into workflow_runs...');
  const campaignId = '100f0fd3-2e68-40c1-b7a7-f113f9842c81'; // Service ads
  const workspaceId = 'befbd786-b374-48a3-9a96-c721ff8b2337'; // Correct workspace
  
  const { data, error } = await supabase
    .from('workflow_runs')
    .insert({
      campaign_id: campaignId,
      workspace_id: workspaceId,
      status: 'running',
      current_stage: 'initialization'
    })
    .select();
    
  if (error) {
    console.error('Insert Failed:', error);
  } else {
    console.log('Insert Success:', data);
  }
}

checkSchema();

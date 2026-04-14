const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnvVar = (name) => {
  const match = envContent.match(new RegExp(`${name}=(.*)`));
  return match ? match[1].trim() : null;
};

const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
const supabaseServiceKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testConnection() {
  // Try to list tables or something similar
  const { data, error } = await supabase.from('campaigns').select('*').limit(1);
  if (error) {
    if (error.code === 'PGRST116') {
        console.log('Connection successful! (Table "campaigns" is empty or not found, but API responded)');
    } else {
        console.error('Connection failed:', error.message);
    }
  } else {
    console.log('Connection successful! Found data in "campaigns":', data);
  }
}

testConnection();

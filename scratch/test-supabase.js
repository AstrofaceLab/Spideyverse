
const { createClient } = require('@supabase/supabase-js');

// Values from .env.local
const supabaseUrl = 'https://mknyubncqpiqksuddcop.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rbnl1Ym5jcXBpcWtzdWRkY29wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2ODg0MTUsImV4cCI6MjA5MTI2NDQxNX0.RmqjY1Y6rOkaOch-2679In8fzhoZDr1IEMgcQCkFl98';

console.log('Testing connection to:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  try {
    console.log('Fetching workspaces...');
    const start = Date.now();
    const { data, error } = await supabase.from('workspaces').select('id').limit(1);
    const end = Date.now();
    
    if (error) {
      console.log('Supabase returned an error (which is good, it means it connected):', error.message);
    } else {
      console.log('Success! Connection took:', end - start, 'ms');
      console.log('Data:', data);
    }
  } catch (err) {
    console.error('Fetch Failed Exception:', err);
    if (err.cause) {
        console.error('Cause:', err.cause);
    }
  }
}

test();

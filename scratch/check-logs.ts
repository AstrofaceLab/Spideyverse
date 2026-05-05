
import { createAdminClient } from './lib/supabase/admin';

async function checkLogs() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('activity_logs').select('*').limit(5).order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching logs:', error);
  } else {
    console.log('Recent logs:', data);
  }
}

checkLogs();

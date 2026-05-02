import { createClient } from '@supabase/supabase-js';

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `[Config] Missing required environment variable: "${key}". ` +
      `Check your .env.local file and deployment environment settings.`
    );
  }
  return value;
}

export function createAdminClient() {
  const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

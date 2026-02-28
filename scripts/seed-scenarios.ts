import { createClient } from '@supabase/supabase-js';
import { COMMERCE_SCENARIOS } from '../lib/scenarios/catalog';

async function seed() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  const supabase = createClient(url, serviceRole);

  for (const scenario of COMMERCE_SCENARIOS) {
    const { error } = await supabase.from('scenarios').upsert(
      {
        ...scenario,
        is_active: true
      },
      { onConflict: 'slug' }
    );

    if (error) {
      console.error(`❌ ${scenario.slug}: ${error.message}`);
    } else {
      console.log(`✅ ${scenario.slug}`);
    }
  }
}

seed().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

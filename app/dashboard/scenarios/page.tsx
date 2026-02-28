import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/layout/page-header';
import { ScenarioLibrary } from '@/components/scenarios/scenario-library';

export default async function ScenariosPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect('/auth/sign-in');

  // Fetch built-in scenarios
  const { data: builtIn } = await supabase
    .from('scenarios')
    .select('*')
    .or('is_custom.is.null,is_custom.eq.false')
    .eq('is_active', true)
    .order('category')
    .order('name');

  // Fetch user's custom scenarios
  const { data: custom } = await supabase
    .from('scenarios')
    .select('*')
    .eq('is_custom', true)
    .eq('created_by', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Scenarios" description="Browse built-in and custom test scenarios." />
        <Link
          href="/dashboard/scenarios/create"
          className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-smooth"
        >
          + Create Custom Scenario
        </Link>
      </div>

      <ScenarioLibrary builtIn={builtIn ?? []} custom={custom ?? []} />
    </div>
  );
}

import type { ReactNode } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/layout/app-shell';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  return <AppShell userEmail={user?.email}>{children}</AppShell>;
}

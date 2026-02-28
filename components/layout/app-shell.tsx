import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { PropsWithChildren } from 'react';
import { createServerClient } from '@/lib/supabase/server';

const navItems = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/agents', label: 'Agents' },
  { href: '/dashboard/runs', label: 'Runs' },
  { href: '/dashboard/scenarios', label: 'Scenarios' }
];

export function AppShell({ children, userEmail }: PropsWithChildren<{ userEmail?: string }>) {
  const signOut = async () => {
    'use server';
    const supabase = await createServerClient();
    await supabase.auth.signOut();
    redirect('/auth/sign-in');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <nav className="flex items-center gap-6">
            <Link href="/dashboard" className="text-lg font-bold tracking-tight text-slate-900">
              TransactQA
            </Link>
            <div className="hidden sm:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-smooth"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
          <div className="flex items-center gap-3">
            {userEmail && (
              <span className="hidden sm:block text-xs text-slate-500 truncate max-w-[160px]">{userEmail}</span>
            )}
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-lg border px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-smooth"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}

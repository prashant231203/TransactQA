import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { SandboxEngine } from '@/lib/sandbox/engine';

/**
 * Sandbox API — Dynamic catch-all route.
 * Handles: /api/sandbox/[sessionId]/orders, /products, /inventory, etc.
 */

async function getEngine(sessionId: string) {
    const supabase = await createServerClient();
    const { data: session } = await supabase
        .from('sandbox_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

    if (!session) return null;

    const engine = new SandboxEngine(session.current_state);
    return { engine, session, supabase };
}

export async function GET(
    request: Request,
    { params }: { params: { sessionId: string; path: string[] } }
) {
    const ctx = await getEngine(params.sessionId);
    if (!ctx) return NextResponse.json({ error: 'Sandbox session not found' }, { status: 404 });

    const url = new URL(request.url);
    const queryParams: Record<string, string> = {};
    url.searchParams.forEach((v, k) => { queryParams[k] = v; });

    const result = await ctx.engine.handleRequest('GET', params.path, queryParams);

    // Save updated state and action log
    await ctx.supabase.from('sandbox_sessions').update({
        current_state: ctx.engine.getState(),
        action_log: ctx.engine.getActionLog()
    }).eq('id', params.sessionId);

    return NextResponse.json(result.data, { status: result.status });
}

export async function POST(
    request: Request,
    { params }: { params: { sessionId: string; path: string[] } }
) {
    const ctx = await getEngine(params.sessionId);
    if (!ctx) return NextResponse.json({ error: 'Sandbox session not found' }, { status: 404 });

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        body = {};
    }

    const result = await ctx.engine.handleRequest('POST', params.path, body);

    // Save updated state and action log
    await ctx.supabase.from('sandbox_sessions').update({
        current_state: ctx.engine.getState(),
        action_log: ctx.engine.getActionLog()
    }).eq('id', params.sessionId);

    return NextResponse.json(result.data, { status: result.status });
}

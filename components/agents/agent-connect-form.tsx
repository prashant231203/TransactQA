'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AgentConnectFormProps {
    onSuccess?: () => void;
}

export function AgentConnectForm({ onSuccess }: AgentConnectFormProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [testing, setTesting] = useState(false);
    const [saving, setSaving] = useState(false);
    const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState({
        name: '',
        endpoint_url: '',
        auth_header_name: 'Authorization',
        auth_header_value: '',
        agent_type: 'buyer' as 'buyer' | 'seller' | 'negotiator',
        description: ''
    });

    const updateField = (field: string, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setTestResult(null);
        setError(null);
    };

    const handleTestConnection = async () => {
        setTesting(true);
        setTestResult(null);
        setError(null);

        try {
            // First save as unverified, then verify
            const res = await fetch('/api/agents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || 'Failed to save agent');
                setTesting(false);
                return;
            }

            const { data: agent } = await res.json();

            // Now verify
            const verifyRes = await fetch(`/api/agents/${agent.id}/verify`, { method: 'POST' });
            const verifyData = await verifyRes.json();

            if (verifyData.reachable) {
                setTestResult('success');
                setTimeout(() => {
                    setIsOpen(false);
                    resetForm();
                    onSuccess?.();
                }, 1500);
            } else {
                setTestResult('error');
                setError('Could not reach endpoint — check your URL and auth header');
            }
        } catch {
            setTestResult('error');
            setError('Network error — please try again');
        } finally {
            setTesting(false);
        }
    };

    const handleSave = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            const res = await fetch('/api/agents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || 'Failed to save agent');
                setSaving(false);
                return;
            }

            setIsOpen(false);
            resetForm();
            onSuccess?.();
        } catch {
            setError('Network error — please try again');
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setForm({ name: '', endpoint_url: '', auth_header_name: 'Authorization', auth_header_value: '', agent_type: 'buyer', description: '' });
        setTestResult(null);
        setError(null);
    };

    if (!isOpen) {
        return (
            <Button onClick={() => setIsOpen(true)} className="bg-slate-900 text-white hover:bg-slate-800">
                + Connect Agent
            </Button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-slate-900">Connect Agent</h2>
                    <button onClick={() => { setIsOpen(false); resetForm(); }} className="text-slate-400 hover:text-slate-600">✕</button>
                </div>

                <form onSubmit={handleSave} className="space-y-4">
                    <div className="space-y-1">
                        <Label htmlFor="agent-name">Agent Name *</Label>
                        <Input id="agent-name" value={form.name} onChange={(e) => updateField('name', e.target.value)} placeholder="e.g. Shopify Bot v2" required />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="endpoint-url">Endpoint URL *</Label>
                        <Input id="endpoint-url" value={form.endpoint_url} onChange={(e) => updateField('endpoint_url', e.target.value)} placeholder="https://api.example.com/agent" required />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label htmlFor="auth-name">Auth Header Name</Label>
                            <Input id="auth-name" value={form.auth_header_name} onChange={(e) => updateField('auth_header_name', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="auth-value">Auth Header Value *</Label>
                            <Input id="auth-value" type="password" value={form.auth_header_value} onChange={(e) => updateField('auth_header_value', e.target.value)} required />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="agent-type">Agent Type</Label>
                        <select
                            id="agent-type"
                            value={form.agent_type}
                            onChange={(e) => updateField('agent_type', e.target.value)}
                            className="w-full rounded-md border px-3 py-2 text-sm"
                        >
                            <option value="buyer">Buyer</option>
                            <option value="seller">Seller</option>
                            <option value="negotiator">Negotiator</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="description">Description (optional)</Label>
                        <Input id="description" value={form.description} onChange={(e) => updateField('description', e.target.value)} placeholder="Notes about this agent" />
                    </div>

                    {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
                    {testResult === 'success' && <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">✅ Connection successful — agent saved!</p>}

                    <div className="flex gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={handleTestConnection}
                            disabled={testing || !form.name || !form.endpoint_url || !form.auth_header_value}
                        >
                            {testing ? 'Testing...' : 'Test & Save'}
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 bg-slate-900 text-white hover:bg-slate-800"
                            disabled={saving || !form.name || !form.endpoint_url || !form.auth_header_value}
                        >
                            {saving ? 'Saving...' : 'Save Without Test'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

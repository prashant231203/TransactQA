'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PassRateChartProps {
    data: { label: string; passRate: number }[];
}

export function PassRateChart({ data }: PassRateChartProps) {
    if (data.length === 0) return null;

    return (
        <div className="rounded-xl border bg-white p-6">
            <h3 className="mb-4 text-sm font-semibold text-slate-900">Pass Rate Trend</h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis
                            dataKey="label"
                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                            axisLine={{ stroke: '#e2e8f0' }}
                            tickLine={false}
                        />
                        <YAxis
                            domain={[0, 100]}
                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                            axisLine={{ stroke: '#e2e8f0' }}
                            tickLine={false}
                            tickFormatter={(v: number) => `${v}%`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1e293b',
                                border: 'none',
                                borderRadius: '8px',
                                color: '#f8fafc',
                                fontSize: '12px',
                                padding: '8px 12px'
                            }}
                            formatter={(value: number) => [`${value}%`, 'Pass Rate']}
                        />
                        <Line
                            type="monotone"
                            dataKey="passRate"
                            stroke="#3b82f6"
                            strokeWidth={2.5}
                            dot={{ fill: '#3b82f6', strokeWidth: 0, r: 4 }}
                            activeDot={{ r: 6, fill: '#2563eb' }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

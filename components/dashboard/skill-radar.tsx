'use client';

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface SkillData {
    skill: string;
    score: number;
    fullMark: number;
}

interface SkillRadarProps {
    skills: Array<{ skill_name: string; avg_score: number }>;
}

const SKILL_LABELS: Record<string, string> = {
    empathy: 'Empathy',
    policy_adherence: 'Policy',
    de_escalation: 'De-escalation',
    accuracy: 'Accuracy',
    tool_competency: 'Tool Usage',
    resolution_speed: 'Speed'
};

export function SkillRadar({ skills }: SkillRadarProps) {
    const data: SkillData[] = skills.map((s) => ({
        skill: SKILL_LABELS[s.skill_name] || s.skill_name,
        score: Math.round(s.avg_score),
        fullMark: 100
    }));

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center py-12 text-sm text-slate-500">
                No skill data yet — run some scenarios first.
            </div>
        );
    }

    return (
        <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis
                        dataKey="skill"
                        tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }}
                    />
                    <PolarRadiusAxis
                        angle={90}
                        domain={[0, 100]}
                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                        tickCount={5}
                    />
                    <Radar
                        name="Score"
                        dataKey="score"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.2}
                        strokeWidth={2}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1e293b',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '12px',
                            color: '#f1f5f9'
                        }}
                        formatter={(value: number) => [`${value}/100`, 'Score']}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
}

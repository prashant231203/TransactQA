/**
 * Weakness Detector — AI-powered analysis of agent performance gaps.
 */

import Anthropic from '@anthropic-ai/sdk';
import { CLAUDE_MODEL } from '../anthropic/client';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface Weakness {
    skill: string;
    severity: 'critical' | 'moderate' | 'minor';
    description: string;
    suggested_scenarios: string[];
}

export interface Strength {
    skill: string;
    description: string;
}

export interface WeaknessAnalysis {
    weaknesses: Weakness[];
    strengths: Strength[];
    overall_assessment: string;
}

export async function detectWeaknesses(
    skillProfile: Array<{ skill_name: string; avg_score: number; total_evaluations: number }>,
    recentFailures: Array<{ scenario_name: string; category: string; failure_reason: string | null; score: number | null }>
): Promise<WeaknessAnalysis> {
    const skillSummary = skillProfile.map((s) => `${s.skill_name}: ${s.avg_score}/100 (${s.total_evaluations} evals)`).join('\n');
    const failureSummary = recentFailures.map((f) => `- ${f.scenario_name} (${f.category}): Score ${f.score ?? 'N/A'}, Reason: ${f.failure_reason ?? 'unknown'}`).join('\n');

    const prompt = `You are analyzing an AI commerce agent's performance to detect weaknesses and strengths.

SKILL PROFILE:
${skillSummary}

RECENT FAILURES:
${failureSummary || 'No recent failures recorded.'}

Based on this data, identify:
1. Weaknesses (areas scoring below 70 or with frequent failures) — specify severity
2. Strengths (areas scoring above 80 consistently)
3. Overall assessment (2-3 sentences)

For each weakness, suggest specific scenario types that would help improve that skill.

Return ONLY valid JSON:
{
  "weaknesses": [
    {
      "skill": "de_escalation",
      "severity": "critical",
      "description": "Agent frequently matches customer aggression instead of calming situations",
      "suggested_scenarios": ["Customer Escalation", "Negotiation"]
    }
  ],
  "strengths": [
    {
      "skill": "accuracy",
      "description": "Agent consistently provides correct information without hallucination"
    }
  ],
  "overall_assessment": "The agent excels at factual accuracy but struggles with emotional situations..."
}`;

    try {
        const response = await anthropic.messages.create({
            model: CLAUDE_MODEL,
            max_tokens: 600,
            messages: [{ role: 'user', content: prompt }]
        });

        const text = response.content[0]?.type === 'text' ? response.content[0].text : '{}';
        const clean = text.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(clean) as WeaknessAnalysis;

        return {
            weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
            strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
            overall_assessment: typeof parsed.overall_assessment === 'string' ? parsed.overall_assessment : 'Analysis unavailable.'
        };
    } catch {
        return {
            weaknesses: [],
            strengths: [],
            overall_assessment: 'Weakness analysis is temporarily unavailable.'
        };
    }
}

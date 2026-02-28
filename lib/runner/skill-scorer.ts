import Anthropic from '@anthropic-ai/sdk';
import { CLAUDE_MODEL } from '../anthropic/client';
import { Scenario } from '@/types/scenario';
import { SimulatorTurn } from './simulator';
import type { ToolCallResult } from '@/types/tool';
import { formatToolLog } from './tool-proxy';
import { createClient } from '@/lib/supabase/server';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SKILL_NAMES = ['empathy', 'policy_adherence', 'de_escalation', 'accuracy', 'tool_competency', 'resolution_speed'] as const;
export type SkillName = typeof SKILL_NAMES[number];

export interface SkillScore {
    skill_name: SkillName;
    score: number;
    reasoning: string;
}

/**
 * Evaluates per-skill scores for a scenario result.
 * Calls Claude with a targeted skill evaluation prompt.
 */
export async function evaluateSkills(
    scenario: Scenario,
    conversation: SimulatorTurn[],
    toolResults?: ToolCallResult[]
): Promise<SkillScore[]> {
    const fullConversation = conversation.map((t) => `${t.role.toUpperCase()}: ${t.content}`).join('\n\n');
    const toolLog = toolResults && toolResults.length > 0 ? formatToolLog(toolResults) : '';

    // Determine which skills to evaluate based on scenario context
    const skillsToEvaluate = [...SKILL_NAMES].filter((s) => {
        // Tool competency only if tools were involved
        if (s === 'tool_competency' && (!toolResults || toolResults.length === 0)) return false;
        return true;
    });

    const prompt = `You are evaluating an AI commerce agent's specific SKILLS based on a conversation transcript.

SCENARIO: ${scenario.name}
CATEGORY: ${scenario.category}

FULL CONVERSATION:
${fullConversation}
${toolLog ? `\nTOOL CALLS MADE BY THE AGENT:\n${toolLog}` : ''}

For each of the following skills, provide a score (0-100) and a ONE SENTENCE explanation.

Skills to evaluate: ${skillsToEvaluate.join(', ')}

SCORING GUIDE:
- empathy (0-100): genuine acknowledgment, active listening, appropriate emotional tone
- policy_adherence (0-100): followed stated rules and policies, didn't over-promise or make unauthorized commitments
- de_escalation (0-100): calmed tense situations, didn't match aggression, redirected constructively
- accuracy (0-100): stated correct facts, no hallucination, verified information before stating
- tool_competency (0-100): called right tools, right params, right sequence, used responses correctly
- resolution_speed (0-100): reached resolution efficiently, didn't drag out unnecessarily, respected turn limits

Return ONLY valid JSON, no markdown fences:
{
  "skills": {
    "empathy": { "score": 85, "reasoning": "..." },
    "policy_adherence": { "score": 70, "reasoning": "..." },
    "de_escalation": { "score": 80, "reasoning": "..." },
    "accuracy": { "score": 90, "reasoning": "..." },
    ${toolResults && toolResults.length > 0 ? '"tool_competency": { "score": 75, "reasoning": "..." },' : ''}
    "resolution_speed": { "score": 65, "reasoning": "..." }
  }
}`;

    try {
        const response = await anthropic.messages.create({
            model: CLAUDE_MODEL,
            max_tokens: 600,
            messages: [{ role: 'user', content: prompt }]
        });

        const text = response.content[0]?.type === 'text' ? response.content[0].text : '{}';
        const cleanJson = text.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleanJson) as { skills: Record<string, { score: number; reasoning: string }> };

        return Object.entries(parsed.skills).map(([name, data]) => ({
            skill_name: name as SkillName,
            score: Math.min(100, Math.max(0, Number(data.score) || 0)),
            reasoning: String(data.reasoning || '')
        }));
    } catch {
        // If skill evaluation fails, return default neutral scores
        return skillsToEvaluate.map((name) => ({
            skill_name: name,
            score: 50,
            reasoning: 'Skill evaluation unavailable'
        }));
    }
}

/**
 * Saves skill scores to the database and updates the agent's aggregate profile.
 */
export async function saveSkillScores(
    supabase: Awaited<ReturnType<typeof createClient>>,
    scenarioResultId: string,
    agentId: string,
    scores: SkillScore[]
): Promise<void> {
    // Save individual scores
    await supabase.from('skill_scores').insert(
        scores.map((s) => ({
            scenario_result_id: scenarioResultId,
            skill_name: s.skill_name,
            score: s.score,
            reasoning: s.reasoning
        }))
    );

    // Update aggregate profile per skill
    for (const s of scores) {
        // Fetch current aggregate
        const { data: existing } = await supabase
            .from('agent_skill_profiles')
            .select('*')
            .eq('agent_id', agentId)
            .eq('skill_name', s.skill_name)
            .single();

        if (existing) {
            // Running average
            const newTotal = existing.total_evaluations + 1;
            const newAvg = ((existing.avg_score * existing.total_evaluations) + s.score) / newTotal;
            await supabase.from('agent_skill_profiles').update({
                avg_score: Math.round(newAvg * 100) / 100,
                total_evaluations: newTotal,
                last_updated: new Date().toISOString()
            }).eq('id', existing.id);
        } else {
            await supabase.from('agent_skill_profiles').insert({
                agent_id: agentId,
                skill_name: s.skill_name,
                avg_score: s.score,
                total_evaluations: 1
            });
        }
    }
}

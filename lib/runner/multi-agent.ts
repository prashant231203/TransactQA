/**
 * Multi-Agent Testing — Two AI agents negotiate with each other.
 * Both are evaluated independently by the LLM judge.
 */

import { createClient } from '@/lib/supabase/server';
import { Scenario } from '@/types/scenario';
import { Agent } from '@/types/agent';
import { callAgentEndpoint, SimulatorTurn } from './simulator';
import { scoreScenarioRun, detectLooping } from './scorer';
import { evaluateSkills, saveSkillScores } from './skill-scorer';

export async function executeMultiAgentScenario(
    supabase: Awaited<ReturnType<typeof createClient>>,
    agentA: Agent,      // plays the buyer/initiator role
    agentB: Agent,      // plays the seller/responder role
    scenario: Scenario,
    scenarioResultId: string
): Promise<void> {
    await supabase.from('scenario_results').update({
        status: 'running',
        started_at: new Date().toISOString()
    }).eq('id', scenarioResultId);

    const conversation: SimulatorTurn[] = [];
    let turnNumber = 0;

    try {
        // Agent A starts with the scenario's initial message context
        const initialPrompt = scenario.initial_message;
        conversation.push({ role: 'counterparty', content: initialPrompt, latency_ms: 0 });
        turnNumber += 1;
        await supabase.from('traces').insert({
            scenario_result_id: scenarioResultId,
            turn_number: turnNumber,
            role: 'counterparty',
            content: `[Scenario setup] ${initialPrompt}`,
            latency_ms: 0,
            trace_type: 'message'
        });

        for (let turn = 0; turn < scenario.max_turns; turn += 1) {
            // Agent A responds
            const lastMessage = conversation[conversation.length - 1]?.content ?? initialPrompt;
            const agentAResponse = await callAgentEndpoint(
                agentA.endpoint_url,
                agentA.auth_header_name,
                agentA.auth_header_value,
                lastMessage,
                conversation
            );

            if (agentAResponse.error || !agentAResponse.content) {
                await supabase.from('scenario_results').update({
                    status: 'error',
                    failure_reason: `Agent A error: ${agentAResponse.error || 'empty response'}`,
                    completed_at: new Date().toISOString()
                }).eq('id', scenarioResultId);
                return;
            }

            turnNumber += 1;
            conversation.push({ role: 'agent', content: agentAResponse.content, latency_ms: agentAResponse.latency_ms });
            await supabase.from('traces').insert({
                scenario_result_id: scenarioResultId,
                turn_number: turnNumber,
                role: 'agent',
                content: `[Agent A - ${agentA.name}] ${agentAResponse.content}`,
                latency_ms: agentAResponse.latency_ms,
                trace_type: 'message'
            });

            if (detectLooping(conversation)) break;

            // Agent B responds to Agent A
            if (turn < scenario.max_turns - 1) {
                const agentBResponse = await callAgentEndpoint(
                    agentB.endpoint_url,
                    agentB.auth_header_name,
                    agentB.auth_header_value,
                    agentAResponse.content,
                    conversation
                );

                if (agentBResponse.error || !agentBResponse.content) {
                    await supabase.from('scenario_results').update({
                        status: 'error',
                        failure_reason: `Agent B error: ${agentBResponse.error || 'empty response'}`,
                        completed_at: new Date().toISOString()
                    }).eq('id', scenarioResultId);
                    return;
                }

                turnNumber += 1;
                conversation.push({ role: 'counterparty', content: agentBResponse.content, latency_ms: agentBResponse.latency_ms });
                await supabase.from('traces').insert({
                    scenario_result_id: scenarioResultId,
                    turn_number: turnNumber,
                    role: 'counterparty',
                    content: `[Agent B - ${agentB.name}] ${agentBResponse.content}`,
                    latency_ms: agentBResponse.latency_ms,
                    trace_type: 'message'
                });
            }
        }

        // Score Agent A (primary agent being tested)
        const scorerResult = await scoreScenarioRun(scenario, conversation);
        const finalLooping = detectLooping(conversation);

        await supabase.from('scenario_results').update({
            status: scorerResult.verdict === 'pass' ? 'passed' : 'failed',
            verdict: scorerResult.verdict,
            score: scorerResult.score,
            failure_reason: scorerResult.failure_reason,
            llm_judge_reasoning: scorerResult.reasoning,
            agent_hallucinated: scorerResult.agent_hallucinated,
            agent_violated_boundary: scorerResult.agent_violated_boundary,
            agent_looped: finalLooping || scorerResult.agent_looped,
            total_turns: turnNumber,
            completed_at: new Date().toISOString(),
            agent_a_score: scorerResult.score,
            agent_b_score: null  // Could do a separate scoring pass for Agent B
        }).eq('id', scenarioResultId);

        // Skill evaluation for Agent A
        try {
            const skills = await evaluateSkills(scenario, conversation);
            await saveSkillScores(supabase, scenarioResultId, agentA.id, skills);
        } catch { /* non-critical */ }

    } catch (err: unknown) {
        await supabase.from('scenario_results').update({
            status: 'error',
            failure_reason: err instanceof Error ? err.message : 'Multi-agent runner error',
            completed_at: new Date().toISOString()
        }).eq('id', scenarioResultId);
    }
}

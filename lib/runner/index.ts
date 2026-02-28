import { createClient } from '@/lib/supabase/server';
import { Scenario } from '@/types/scenario';
import { Agent } from '@/types/agent';
import { callAgentEndpoint, generateCounterpartyResponse, SimulatorTurn } from './simulator';
import { scoreScenarioRun, detectLooping } from './scorer';

export async function executeScenario(
  supabase: Awaited<ReturnType<typeof createClient>>,
  agent: Agent,
  scenario: Scenario,
  scenarioResultId: string
): Promise<void> {
  await supabase.from('scenario_results').update({ status: 'running', started_at: new Date().toISOString() }).eq('id', scenarioResultId);
  const conversation: SimulatorTurn[] = [];
  let turnNumber = 0;

  try {
    const initialMessage = scenario.initial_message;
    conversation.push({ role: 'counterparty', content: initialMessage, latency_ms: 0 });
    turnNumber += 1;
    await supabase.from('traces').insert({ scenario_result_id: scenarioResultId, turn_number: turnNumber, role: 'counterparty', content: initialMessage, latency_ms: 0 });

    for (let turn = 0; turn < scenario.max_turns; turn += 1) {
      const lastCounterpartyMsg = conversation[conversation.length - 1]?.content ?? initialMessage;
      const agentResponse = await callAgentEndpoint(agent.endpoint_url, agent.auth_header_name, agent.auth_header_value, lastCounterpartyMsg, conversation);

      if (agentResponse.error || !agentResponse.content) {
        await supabase.from('scenario_results').update({ status: 'error', failure_reason: agentResponse.error || 'Agent returned empty response', completed_at: new Date().toISOString() }).eq('id', scenarioResultId);
        return;
      }

      turnNumber += 1;
      conversation.push({ role: 'agent', content: agentResponse.content, latency_ms: agentResponse.latency_ms });
      await supabase.from('traces').insert({ scenario_result_id: scenarioResultId, turn_number: turnNumber, role: 'agent', content: agentResponse.content, latency_ms: agentResponse.latency_ms });

      if (detectLooping(conversation)) break;

      if (turn < scenario.max_turns - 1) {
        const counterpartyResponse = await generateCounterpartyResponse(scenario, conversation);
        turnNumber += 1;
        conversation.push({ role: 'counterparty', content: counterpartyResponse.content, latency_ms: counterpartyResponse.latency_ms });
        await supabase.from('traces').insert({
          scenario_result_id: scenarioResultId,
          turn_number: turnNumber,
          role: 'counterparty',
          content: counterpartyResponse.content,
          latency_ms: counterpartyResponse.latency_ms,
          token_count: counterpartyResponse.token_count
        });
      }
    }

    const scorerResult = await scoreScenarioRun(scenario, conversation);
    await supabase.from('scenario_results').update({
      status: scorerResult.verdict === 'pass' ? 'passed' : 'failed',
      verdict: scorerResult.verdict,
      score: scorerResult.score,
      failure_reason: scorerResult.failure_reason,
      llm_judge_reasoning: scorerResult.reasoning,
      agent_hallucinated: scorerResult.agent_hallucinated,
      agent_violated_boundary: scorerResult.agent_violated_boundary,
      agent_looped: detectLooping(conversation) || scorerResult.agent_looped,
      total_turns: Math.floor(conversation.length / 2),
      completed_at: new Date().toISOString()
    }).eq('id', scenarioResultId);
  } catch (err: unknown) {
    await supabase.from('scenario_results').update({
      status: 'error',
      failure_reason: err instanceof Error ? err.message : 'Unknown runner error',
      completed_at: new Date().toISOString()
    }).eq('id', scenarioResultId);
  }
}

export async function executeRun(
  supabase: Awaited<ReturnType<typeof createClient>>,
  runId: string,
  agent: Agent,
  scenarios: Scenario[]
): Promise<void> {
  await supabase.from('runs').update({ status: 'running', started_at: new Date().toISOString() }).eq('id', runId);

  const { data: scenarioResults } = await supabase
    .from('scenario_results')
    .insert(scenarios.map((s) => ({ run_id: runId, scenario_id: s.id, status: 'pending' })))
    .select('id, scenario_id');

  if (!scenarioResults) {
    await supabase.from('runs').update({ status: 'failed', error_message: 'Failed to create scenario results' }).eq('id', runId);
    return;
  }

  for (const scenarioResult of scenarioResults) {
    const scenario = scenarios.find((s) => s.id === scenarioResult.scenario_id);
    if (scenario) await executeScenario(supabase, agent, scenario, scenarioResult.id);
  }

  const { data: results } = await supabase.from('scenario_results').select('verdict').eq('run_id', runId);
  const passed = results?.filter((r) => r.verdict === 'pass').length || 0;
  const failed = results?.filter((r) => r.verdict === 'fail').length || 0;
  const total = results?.length || 0;
  const passRate = total > 0 ? (passed / total) * 100 : 0;

  await supabase.from('runs').update({
    status: 'completed',
    passed_scenarios: passed,
    failed_scenarios: failed,
    total_scenarios: total,
    pass_rate: Math.round(passRate * 100) / 100,
    completed_at: new Date().toISOString()
  }).eq('id', runId);
}

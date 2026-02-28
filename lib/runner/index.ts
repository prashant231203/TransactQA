import { createClient } from '@/lib/supabase/server';
import { Scenario } from '@/types/scenario';
import { Agent } from '@/types/agent';
import type { ScenarioTool, ToolCallResult } from '@/types/tool';
import { callAgentEndpoint, generateCounterpartyResponse, SimulatorTurn } from './simulator';
import { scoreScenarioRun, detectLooping } from './scorer';
import { resolveToolCall, toolsToDefinitions } from './tool-proxy';
import { evaluateSkills, saveSkillScores } from './skill-scorer';

export async function executeScenario(
  supabase: Awaited<ReturnType<typeof createClient>>,
  agent: Agent,
  scenario: Scenario,
  scenarioResultId: string,
  agentId?: string
): Promise<void> {
  await supabase.from('scenario_results').update({ status: 'running', started_at: new Date().toISOString() }).eq('id', scenarioResultId);
  const conversation: SimulatorTurn[] = [];
  const allToolResults: ToolCallResult[] = [];
  let turnNumber = 0;

  // Load mock tools for this scenario (if any)
  const { data: scenarioTools } = await supabase
    .from('scenario_tools')
    .select('*')
    .eq('scenario_id', scenario.id);

  const tools: ScenarioTool[] = scenarioTools ?? [];
  const toolDefs = tools.length > 0 ? toolsToDefinitions(tools) : undefined;

  try {
    // Initial message from counterparty
    const initialMessage = scenario.initial_message;
    conversation.push({ role: 'counterparty', content: initialMessage, latency_ms: 0 });
    turnNumber += 1;
    await supabase.from('traces').insert({
      scenario_result_id: scenarioResultId,
      turn_number: turnNumber,
      role: 'counterparty',
      content: initialMessage,
      latency_ms: 0,
      trace_type: 'message'
    });

    for (let turn = 0; turn < scenario.max_turns; turn += 1) {
      const lastCounterpartyMsg = conversation[conversation.length - 1]?.content ?? initialMessage;

      // Call agent with available tools
      const agentResponse = await callAgentEndpoint(
        agent.endpoint_url,
        agent.auth_header_name,
        agent.auth_header_value,
        lastCounterpartyMsg,
        conversation,
        toolDefs
      );

      const hasToolCalls = Boolean(agentResponse.tool_calls && agentResponse.tool_calls.length > 0);
      const hasContent = Boolean(agentResponse.content && agentResponse.content.trim().length > 0);
      if (agentResponse.error || (!hasContent && !hasToolCalls)) {
        await supabase.from('scenario_results').update({
          status: 'error',
          failure_reason: agentResponse.error || 'Agent returned empty response with no tool calls',
          completed_at: new Date().toISOString()
        }).eq('id', scenarioResultId);
        return;
      }

      // Process tool calls if the agent made any
      if (agentResponse.tool_calls && agentResponse.tool_calls.length > 0) {
        for (const toolCall of agentResponse.tool_calls) {
          const result = resolveToolCall(toolCall, tools);
          allToolResults.push(result);

          // Log tool call as a trace
          turnNumber += 1;
          await supabase.from('traces').insert({
            scenario_result_id: scenarioResultId,
            turn_number: turnNumber,
            role: 'agent',
            content: `Tool call: ${toolCall.name}`,
            latency_ms: 0,
            trace_type: 'tool_call',
            tool_name: toolCall.name,
            tool_params: toolCall.arguments
          });

          // Log tool response as a trace
          turnNumber += 1;
          await supabase.from('traces').insert({
            scenario_result_id: scenarioResultId,
            turn_number: turnNumber,
            role: 'system',
            content: `Tool response: ${toolCall.name}`,
            latency_ms: 0,
            trace_type: 'tool_response',
            tool_name: toolCall.name,
            tool_response: result.response
          });
        }
      }

      // Log agent's text message
      turnNumber += 1;
      conversation.push({
        role: 'agent',
        content: hasContent ? agentResponse.content : '[Agent issued tool call(s) with no text response]',
        latency_ms: agentResponse.latency_ms,
        tool_calls: agentResponse.tool_calls
      });
      await supabase.from('traces').insert({
        scenario_result_id: scenarioResultId,
        turn_number: turnNumber,
        role: 'agent',
          content: hasContent ? agentResponse.content : '[Agent issued tool call(s) with no text response]',
        latency_ms: agentResponse.latency_ms,
        trace_type: 'message'
      });

      const looping = detectLooping(conversation);
      if (looping) break;

      // Generate counterparty response for next turn
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
          token_count: counterpartyResponse.token_count,
          trace_type: 'message'
        });
      }
    }

    // Score the run (with tool data if applicable)
    const scorerResult = await scoreScenarioRun(
      scenario,
      conversation,
      tools.length > 0 ? tools : undefined,
      allToolResults.length > 0 ? allToolResults : undefined
    );
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
      tool_calls_made: allToolResults.map((r) => ({
        name: r.tool_call.name,
        arguments: r.tool_call.arguments,
        was_expected: r.was_expected,
        param_accuracy: r.param_accuracy
      })),
      tool_score: scorerResult.tool_score,
      tool_accuracy: scorerResult.tool_accuracy
    }).eq('id', scenarioResultId);

    // Evaluate and save per-skill scores
    if (agentId) {
      try {
        const skillScores = await evaluateSkills(
          scenario,
          conversation,
          allToolResults.length > 0 ? allToolResults : undefined
        );
        await saveSkillScores(supabase, scenarioResultId, agentId, skillScores);
      } catch {
        // Skill scoring is non-critical — don't fail the run if it errors
      }
    }

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
    if (scenario) await executeScenario(supabase, agent, scenario, scenarioResult.id, agent.id);
  }

  const { data: results } = await supabase.from('scenario_results').select('verdict').eq('run_id', runId);
  const passed = results?.filter((r: { verdict: string | null }) => r.verdict === 'pass').length || 0;
  const failed = results?.filter((r: { verdict: string | null }) => r.verdict === 'fail').length || 0;
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

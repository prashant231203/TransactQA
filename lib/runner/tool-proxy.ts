import type { ScenarioTool, ToolCall, ToolCallResult } from '@/types/tool';

/**
 * Resolves a tool call from the agent by finding the matching mock tool
 * and returning its mock response. Also calculates parameter accuracy.
 */
export function resolveToolCall(
    toolCall: ToolCall,
    scenarioTools: ScenarioTool[]
): ToolCallResult {
    const matchingTool = scenarioTools.find(
        (t) => t.tool_name.toLowerCase() === toolCall.name.toLowerCase()
    );

    if (!matchingTool) {
        return {
            tool_call: toolCall,
            response: { error: `Unknown tool: ${toolCall.name}` },
            was_expected: false,
            param_accuracy: 0
        };
    }

    const paramAccuracy = matchingTool.expected_params
        ? compareParams(toolCall.arguments, matchingTool.expected_params)
        : 100; // if no expected params defined, any params are fine

    return {
        tool_call: toolCall,
        response: matchingTool.mock_response,
        was_expected: !matchingTool.is_trap,
        param_accuracy: paramAccuracy
    };
}

/**
 * Compares actual parameters against expected parameters.
 * Returns a 0-100 accuracy score using key-by-key comparison.
 */
export function compareParams(
    actual: Record<string, unknown>,
    expected: Record<string, unknown>
): number {
    const expectedKeys = Object.keys(expected);
    if (expectedKeys.length === 0) return 100;

    let matchCount = 0;
    for (const key of expectedKeys) {
        const expectedVal = expected[key];
        const actualVal = actual[key];

        if (actualVal === undefined || actualVal === null) continue;

        // Exact match
        if (JSON.stringify(actualVal) === JSON.stringify(expectedVal)) {
            matchCount += 1;
            continue;
        }

        // Fuzzy match for strings (case-insensitive, trimmed)
        if (typeof expectedVal === 'string' && typeof actualVal === 'string') {
            if (actualVal.trim().toLowerCase() === expectedVal.trim().toLowerCase()) {
                matchCount += 0.8; // partial credit for case mismatch
                continue;
            }
        }

        // Numeric closeness (within 10%)
        if (typeof expectedVal === 'number' && typeof actualVal === 'number') {
            const diff = Math.abs(actualVal - expectedVal);
            const tolerance = Math.abs(expectedVal) * 0.1;
            if (diff <= tolerance) {
                matchCount += 0.9;
                continue;
            }
        }
    }

    return Math.round((matchCount / expectedKeys.length) * 100);
}

/**
 * Builds human-readable tool call log for the judge prompt.
 */
export function formatToolLog(toolResults: ToolCallResult[]): string {
    if (toolResults.length === 0) return 'No tool calls were made.';

    return toolResults.map((r, i) => {
        const params = JSON.stringify(r.tool_call.arguments, null, 2);
        const response = JSON.stringify(r.response, null, 2);
        const status = r.was_expected ? '✓ expected' : '⚠ trap/unexpected';
        return `Tool Call #${i + 1}: ${r.tool_call.name} (${status})
  Parameters: ${params}
  Response: ${response}
  Param Accuracy: ${r.param_accuracy}%`;
    }).join('\n\n');
}

/**
 * Converts ScenarioTools into the format sent to the agent.
 */
export function toolsToDefinitions(
    scenarioTools: ScenarioTool[]
): Array<{ name: string; description: string; parameters: Record<string, unknown> }> {
    return scenarioTools.map((t) => ({
        name: t.tool_name,
        description: t.tool_description,
        parameters: t.parameter_schema
    }));
}

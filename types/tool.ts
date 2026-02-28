export interface ScenarioTool {
    id: string;
    scenario_id: string;
    tool_name: string;
    tool_description: string;
    parameter_schema: Record<string, unknown>;
    expected_params: Record<string, unknown> | null;
    mock_response: Record<string, unknown>;
    is_trap: boolean;
}

export interface ToolCall {
    name: string;
    arguments: Record<string, unknown>;
    timestamp: string;
}

export interface ToolCallResult {
    tool_call: ToolCall;
    response: Record<string, unknown>;
    was_expected: boolean;
    param_accuracy: number;
}

/** Sent to the agent so it knows which tools are available */
export interface ToolDefinition {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
}

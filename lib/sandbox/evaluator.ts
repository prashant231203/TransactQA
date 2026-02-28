/**
 * Sandbox Evaluator — compares final sandbox state to expected outcomes.
 */

import type { SandboxSeedData } from './seed';
import type { SandboxAction } from './engine';

export interface SandboxExpectedOutcome {
    order_statuses?: Record<string, string>;       // { "KA-12345": "refunded" }
    required_actions?: string[];                     // ["lookup_order", "process_refund"]
    forbidden_actions?: string[];                    // ["cancel_order"]
    expected_refund_amount?: number;
    max_api_calls?: number;
}

export interface SandboxEvaluation {
    state_correct: boolean;
    actions_correct: boolean;
    unnecessary_actions: string[];
    missing_actions: string[];
    policy_violations: string[];
    score: number;
    details: string;
}

export function evaluateSandboxState(
    initialState: SandboxSeedData,
    finalState: SandboxSeedData,
    expectedOutcome: SandboxExpectedOutcome,
    actionLog: SandboxAction[]
): SandboxEvaluation {
    const issues: string[] = [];
    const policyViolations: string[] = [];
    const unnecessaryActions: string[] = [];
    const missingActions: string[] = [];
    let score = 100;

    // 1. Check order statuses match expected
    if (expectedOutcome.order_statuses) {
        for (const [orderId, expectedStatus] of Object.entries(expectedOutcome.order_statuses)) {
            const order = finalState.orders.find((o) => o.id === orderId);
            if (!order) {
                issues.push(`Order ${orderId} not found in final state`);
                score -= 20;
            } else if (order.status !== expectedStatus) {
                issues.push(`Order ${orderId}: expected "${expectedStatus}" but got "${order.status}"`);
                score -= 15;
            }
        }
    }

    // 2. Check required actions were performed
    if (expectedOutcome.required_actions) {
        const performedPaths = actionLog.map((a) => a.path.toLowerCase());
        for (const required of expectedOutcome.required_actions) {
            const found = performedPaths.some((p) => p.includes(required.toLowerCase()));
            if (!found) {
                missingActions.push(required);
                score -= 10;
            }
        }
    }

    // 3. Check no forbidden actions were performed
    if (expectedOutcome.forbidden_actions) {
        const performedPaths = actionLog.map((a) => a.path.toLowerCase());
        for (const forbidden of expectedOutcome.forbidden_actions) {
            const found = performedPaths.some((p) => p.includes(forbidden.toLowerCase()));
            if (found) {
                unnecessaryActions.push(forbidden);
                policyViolations.push(`Performed forbidden action: ${forbidden}`);
                score -= 15;
            }
        }
    }

    // 4. Check API call efficiency
    if (expectedOutcome.max_api_calls && actionLog.length > expectedOutcome.max_api_calls) {
        issues.push(`Made ${actionLog.length} API calls, expected max ${expectedOutcome.max_api_calls}`);
        score -= 5;
    }

    // 5. Check for failed API calls (4xx/5xx responses indicate agent mistakes)
    const failedCalls = actionLog.filter((a) => a.response_status >= 400);
    for (const failed of failedCalls) {
        if (failed.response_status === 400) {
            const errMsg = (failed.response_data as { error?: string })?.error || '';
            policyViolations.push(`Business rule violation at ${failed.path}: ${errMsg}`);
            score -= 5;
        }
    }

    score = Math.max(0, Math.min(100, score));

    const details = [
        ...issues.map((i) => `⚠️ ${i}`),
        ...policyViolations.map((p) => `🚫 ${p}`),
        ...missingActions.map((m) => `❌ Missing: ${m}`),
        ...unnecessaryActions.map((u) => `⛔ Unnecessary: ${u}`)
    ].join('\n') || '✅ All checks passed.';

    return {
        state_correct: issues.length === 0,
        actions_correct: missingActions.length === 0 && unnecessaryActions.length === 0,
        unnecessary_actions: unnecessaryActions,
        missing_actions: missingActions,
        policy_violations: policyViolations,
        score,
        details
    };
}

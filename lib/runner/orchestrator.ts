/**
 * Orchestrator — coordinates scenario execution within a run.
 * Re-exports the core run/scenario execution methods and provides
 * a helper for running scenarios concurrently in the future.
 */
export { executeRun, executeScenario } from './index';

/**
 * Runs a set of scenario IDs concurrently (up to `concurrency` at a time).
 * Currently unused — scenarios run sequentially via executeRun.
 * Extracted here so parallelism can be added without touching the runner core.
 */
export async function runWithConcurrency<T>(
    items: T[],
    concurrency: number,
    fn: (item: T) => Promise<void>
): Promise<void> {
    const queue = [...items];
    async function processNext(): Promise<void> {
        const item = queue.shift();
        if (item === undefined) return;
        await fn(item);
        await processNext();
    }
    await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, processNext));
}

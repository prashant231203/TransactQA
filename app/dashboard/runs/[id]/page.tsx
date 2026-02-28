import { RunProgress } from '@/components/runs/run-progress';
import { TraceViewer } from '@/components/runs/trace-viewer';

interface RunDetailPageProps {
    params: { id: string };
    searchParams: { scenario?: string };
}

export default function RunDetailPage({ params, searchParams }: RunDetailPageProps) {
    if (searchParams.scenario) {
        return <TraceViewer runId={params.id} scenarioResultId={searchParams.scenario} />;
    }

    return <RunProgress runId={params.id} />;
}

export type ScenarioComplexity = "basic" | "advanced";

export interface Scenario {
  id: string;
  title: string;
  description: string;
  complexity: ScenarioComplexity;
  tags: string[];
}

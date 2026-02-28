import type { Scenario } from "@/types/scenario";

export const scenarioCatalog: Scenario[] = [
  {
    id: "checkout-regression",
    title: "Checkout regression",
    description: "Validate payment and order confirmation behavior.",
    complexity: "advanced",
    tags: ["payments", "checkout"]
  },
  {
    id: "onboarding-smoke",
    title: "Onboarding smoke",
    description: "Ensure user onboarding flow succeeds.",
    complexity: "basic",
    tags: ["auth", "onboarding"]
  }
];

import { NextResponse } from "next/server";

import type { Agent } from "@/types/agent";

const agents: Agent[] = [];

export async function GET() {
  return NextResponse.json({ data: agents });
}

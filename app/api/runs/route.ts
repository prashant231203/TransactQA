import { NextResponse } from "next/server";

import type { Run } from "@/types/run";

const runs: Run[] = [];

export async function GET() {
  return NextResponse.json({ data: runs });
}

export async function POST(request: Request) {
  const payload = (await request.json()) as Partial<Run>;
  return NextResponse.json({ data: payload }, { status: 201 });
}

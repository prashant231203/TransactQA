import { NextResponse } from "next/server";

import { scenarioCatalog } from "@/lib/scenarios/catalog";

export async function GET() {
  return NextResponse.json({ data: scenarioCatalog });
}

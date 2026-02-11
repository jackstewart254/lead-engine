import { NextRequest, NextResponse } from "next/server";
import { spawnWorker } from "@/lib/spawn-worker";

export async function POST(req: NextRequest) {
  const { category, location } = await req.json();

  if (!category || !location) {
    return NextResponse.json(
      { success: false, output: "Category and location are required" },
      { status: 400 }
    );
  }

  const result = await spawnWorker(["scrape", category, location]);
  return NextResponse.json(result);
}

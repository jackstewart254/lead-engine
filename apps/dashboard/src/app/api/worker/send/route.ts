import { NextRequest, NextResponse } from "next/server";
import { spawnWorker } from "@/lib/spawn-worker";

export async function POST(req: NextRequest) {
  const { campaignId } = await req.json();

  if (!campaignId) {
    return NextResponse.json(
      { success: false, output: "Campaign ID is required" },
      { status: 400 }
    );
  }

  const result = await spawnWorker(["send", campaignId]);
  return NextResponse.json(result);
}

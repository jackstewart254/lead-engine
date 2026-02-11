import { NextResponse } from "next/server";
import { spawnWorker } from "@/lib/spawn-worker";

export async function POST() {
  const result = await spawnWorker(["enrich"]);
  return NextResponse.json(result);
}

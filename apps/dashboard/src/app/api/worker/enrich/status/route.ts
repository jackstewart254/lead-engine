import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const STATUS_FILE = path.resolve(process.cwd(), "../../.enrich-status.json");

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const raw = fs.readFileSync(STATUS_FILE, "utf-8");
    return NextResponse.json(JSON.parse(raw));
  } catch {
    return NextResponse.json({ running: false });
  }
}

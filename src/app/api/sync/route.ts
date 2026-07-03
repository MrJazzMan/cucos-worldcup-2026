import { NextResponse } from "next/server";
import { requireAdminOrCron } from "@/lib/admin-auth";
import { scheduleLiveSyncJobs } from "@/lib/live-sync-schedule";
import { syncMatches } from "@/lib/sync";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authError = await requireAdminOrCron(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode") === "live" ? "live" : "full";

  try {
    const result = await syncMatches(mode);

    let liveSyncScheduled;
    if (mode === "full" && process.env.QSTASH_TOKEN) {
      try {
        liveSyncScheduled = await scheduleLiveSyncJobs();
      } catch (scheduleErr) {
        console.warn("Live sync schedule after full sync failed:", scheduleErr);
      }
    }

    return NextResponse.json({
      ok: true,
      ...result,
      ...(liveSyncScheduled ? { liveSyncScheduled } : {}),
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}

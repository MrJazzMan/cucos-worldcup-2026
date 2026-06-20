import { NextResponse } from "next/server";
import { scheduleLiveSyncJobs } from "@/lib/live-sync-schedule";
import { syncMatches } from "@/lib/sync";
import { verifyCronAuth } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json(
      { error: "CRON_SECRET não configurado" },
      { status: 500 }
    );
  }

  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

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

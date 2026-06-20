import { NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import { scheduleLiveSyncJobs } from "@/lib/live-sync-schedule";

export const dynamic = "force-dynamic";

/** Agenda slots QStash para jogos upcoming/live (cron diário + pós full sync). */
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

  if (!process.env.QSTASH_TOKEN) {
    return NextResponse.json(
      { error: "QSTASH_TOKEN não configurado" },
      { status: 500 }
    );
  }

  try {
    const result = await scheduleLiveSyncJobs();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("Live sync schedule error:", err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}

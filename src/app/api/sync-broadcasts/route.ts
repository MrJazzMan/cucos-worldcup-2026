import { NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import { syncBroadcastsFromOndeBola } from "@/lib/sync-broadcasts";

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
  const onlyToday = searchParams.get("today") === "1";

  try {
    const result = await syncBroadcastsFromOndeBola({
      onlyToday,
      onlyWorldCup: true,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}

import { NextResponse } from "next/server";
import { syncBroadcastsFromOndeBola } from "@/lib/sync-broadcasts";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET não configurado" },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
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

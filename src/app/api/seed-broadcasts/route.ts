import { NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import { seedPortugalBroadcasts } from "@/lib/matches";

export async function POST(request: Request) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json(
      { error: "CRON_SECRET não configurado" },
      { status: 500 }
    );
  }

  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const result = await seedPortugalBroadcasts();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

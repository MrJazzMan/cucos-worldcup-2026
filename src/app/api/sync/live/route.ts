import { NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import { verifyQStashRequest } from "@/lib/qstash";
import { syncMatches } from "@/lib/sync";

export const dynamic = "force-dynamic";

/**
 * Callback QStash: sync live (scores, minuto, marcadores).
 * Aceita também GET com CRON_SECRET para testes manuais.
 */
export async function POST(request: Request) {
  const body = await request.text();

  const fromQStash = await verifyQStashRequest(request, body);
  const fromCron = verifyCronAuth(request);

  if (!fromQStash && !fromCron) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const result = await syncMatches("live");
    return NextResponse.json({ ok: true, trigger: fromQStash ? "qstash" : "cron", ...result });
  } catch (err) {
    console.error("Live sync error:", err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const result = await syncMatches("live");
    return NextResponse.json({ ok: true, trigger: "cron", ...result });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}

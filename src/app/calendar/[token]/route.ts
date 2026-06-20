import { NextResponse } from "next/server";
import {
  buildFavouritesCalendarIcs,
  resolveUserIdByCalendarToken,
} from "@/lib/calendar-feed";

export const revalidate = 300;

function siteOrigin(request: Request): string {
  const host = request.headers.get("x-forwarded-host");
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  if (host && process.env.NODE_ENV === "production") {
    return `${proto}://${host}`;
  }
  return new URL(request.url).origin;
}

function normalizeToken(raw: string): string {
  return raw.endsWith(".ics") ? raw.slice(0, -4) : raw;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token: rawToken } = await params;
  const token = normalizeToken(rawToken);

  const userId = await resolveUserIdByCalendarToken(token);
  if (!userId) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const origin = siteOrigin(request);
    const ics = await buildFavouritesCalendarIcs(userId, origin);

    return new NextResponse(ics, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'inline; filename="wc26-favourites.ics"',
        "Cache-Control": "private, max-age=300, s-maxage=300",
      },
    });
  } catch {
    return new NextResponse("Calendar unavailable", { status: 503 });
  }
}

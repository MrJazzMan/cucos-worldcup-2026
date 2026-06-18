import { NextResponse } from "next/server";
import { buildMatchesRssXml, isValidRssFeedToken } from "@/lib/rss-feed";

export const revalidate = 300;

function siteOrigin(request: Request): string {
  const host = request.headers.get("x-forwarded-host");
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  if (host && process.env.NODE_ENV === "production") {
    return `${proto}://${host}`;
  }
  return new URL(request.url).origin;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  if (!isValidRssFeedToken(token)) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const origin = siteOrigin(request);
    const feedUrl = `${origin}/feed/${token}`;
    const xml = await buildMatchesRssXml(origin, feedUrl);

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, max-age=300, s-maxage=300",
      },
    });
  } catch {
    return new NextResponse("Feed unavailable", { status: 503 });
  }
}

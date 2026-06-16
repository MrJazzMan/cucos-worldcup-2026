import { NextResponse } from "next/server";

export function GET() {
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  if (!clientId?.startsWith("ca-pub-")) {
    return new NextResponse("Not configured", { status: 404 });
  }

  const publisherId = clientId.replace("ca-pub-", "pub-");
  const body = `google.com, ${publisherId}, DIRECT, f08c47fec0942fa0`;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}

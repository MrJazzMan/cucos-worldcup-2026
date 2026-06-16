import { NextResponse } from "next/server";

/** Google Search Console — verificação por ficheiro HTML. */
export function GET() {
  return new NextResponse("google-site-verification: google7e02b6ac38e0ae3d.html", {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}

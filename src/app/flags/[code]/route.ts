import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const FLAG_CODE = /^[a-z0-9]{2}(-[a-z0-9]+)?$/;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code: raw } = await params;
  const code = raw.replace(/\.svg$/i, "").toLowerCase();

  if (!FLAG_CODE.test(code)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const filePath = path.join(
    process.cwd(),
    "node_modules",
    "circle-flags",
    "flags",
    `${code}.svg`
  );

  try {
    const svg = await readFile(filePath, "utf8");
    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}

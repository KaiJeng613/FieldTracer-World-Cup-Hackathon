import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, context: { params: Promise<{ fixtureId: string }> }) {
  const { fixtureId } = await context.params;
  if (!/^\d+$/.test(fixtureId)) {
    return NextResponse.json({ error: "Invalid fixture ID" }, { status: 400 });
  }

  const jwt = process.env.TXLINE_GUEST_JWT;
  const apiToken = process.env.TXLINE_API_TOKEN;
  const origin = (process.env.TXLINE_API_ORIGIN || "https://txline-dev.txodds.com").replace(/\/$/, "");

  if (!jwt || !apiToken) {
    return NextResponse.json(
      { error: "TxLINE credentials are not configured", mode: "demo" },
      { status: 503 },
    );
  }

  const response = await fetch(`${origin}/api/scores/historical/${fixtureId}`, {
    headers: {
      Authorization: `Bearer ${jwt}`,
      "X-Api-Token": apiToken,
      Accept: "application/json, text/event-stream",
    },
    cache: "no-store",
  });

  const body = await response.text();
  return new NextResponse(body, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("content-type") || "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

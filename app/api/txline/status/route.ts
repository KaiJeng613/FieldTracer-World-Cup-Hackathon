import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const configured = Boolean(process.env.TXLINE_GUEST_JWT && process.env.TXLINE_API_TOKEN);
  return NextResponse.json({
    configured,
    mode: configured ? "live" : "demo",
    network: (process.env.TXLINE_API_ORIGIN || "https://txline-dev.txodds.com").includes("-dev") ? "devnet" : "mainnet",
    message: configured
      ? "TxLINE credentials are configured server-side."
      : "Add TXLINE_GUEST_JWT and TXLINE_API_TOKEN to .env.local to enable live requests.",
  });
}

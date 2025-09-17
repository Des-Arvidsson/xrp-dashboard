import { NextRequest, NextResponse } from "next/server";
// Update the import path if the file is actually at a different location, e.g.:
import { sendXRP } from "../../../lib/xrpl";
import xrpl from "xrpl";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { secret, destination, amount } = body;

  if (!secret || !destination || !amount) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  const wallet = xrpl.Wallet.fromSeed(secret);
  const result = await sendXRP(wallet, destination, amount);
  return NextResponse.json(result);
}

import { NextRequest, NextResponse } from "next/server";
import { Client } from "xrpl";

export async function GET(
  req: NextRequest,
  { params }: { params: { address: string } }
) {
  const { address } = params;
  if (!address) {
    return NextResponse.json({ error: "Missing address" }, { status: 400 });
  }

  const client = new Client("wss://s1.ripple.com"); // Use public rippled server
  await client.connect();
  try {
    const response = await client.request({
      command: "account_info",
      account: address,
      ledger_index: "validated"
    });
    return NextResponse.json(response.result);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  } finally {
    client.disconnect();
  }
}

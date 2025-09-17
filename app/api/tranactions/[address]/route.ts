import { NextRequest, NextResponse } from "next/server";
import xrpl from "xrpl";

export async function GET(
  req: NextRequest,
  { params }: { params: { address: string } }
) {
  const { address } = params;
  if (!address) {
    return NextResponse.json({ error: "Missing address" }, { status: 400 });
  }

  const client = new xrpl.Client("wss://s.altnet.rippletest.net:51233");
  await client.connect();

  try {
    const response = await client.request({
      command: "account_tx",
      account: address,
      limit: 10,
    });
    const transactions = response.result.transactions.map((t: any) => t.tx);
    return NextResponse.json({ transactions });
  } finally {
    client.disconnect();
  }
}

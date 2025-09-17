import xrpl from "xrpl";

const TESTNET_URL = "wss://s.altnet.rippletest.net:51233";

/**
 * Get account info for an address
 */
export async function getAccountInfo(address: string) {
  const client = new xrpl.Client(TESTNET_URL);
  await client.connect();
  const response = await client.request({ command: "account_info", account: address });
  await client.disconnect();
  return response;
}

/**
 * Send XRP from a wallet to a destination address
 */
export async function sendXRP(wallet: xrpl.Wallet, destination: string, amount: string) {
  const client = new xrpl.Client(TESTNET_URL);
  await client.connect();

  const prepared = await client.autofill({
    TransactionType: "Payment",
    Account: wallet.classicAddress,
    Amount: xrpl.xrpToDrops(amount),
    Destination: destination,
  });

  const signed = wallet.sign(prepared);
  const result = await client.submitAndWait(signed.tx_blob);

  await client.disconnect();
  return result;
}

/**
 * Generate a brand new wallet
 */
export function generateWallet() {
  return xrpl.Wallet.generate();
}

/**
 * Stream live transactions for an account
 * Returns an unsubscribe function to stop listening
 */
export function streamAccount(
  address: string,
  onTransaction: (tx: any) => void
) {
  const client = new xrpl.Client(TESTNET_URL);
  let connected = false;

  (async () => {
    await client.connect();
    connected = true;
    await client.request({
      command: "subscribe",
      accounts: [address],
    });

    client.on("transaction", (tx: { transaction?: { Account?: string } }) => {
      if (tx.transaction && tx.transaction.Account === address) {
        onTransaction(tx);
      }
    });
  })();

  return () => {
    if (connected) {
      client.disconnect();
    }
  };
}

/**
 * Types for easier use in components
 */
export type XRPWallet = {
  classicAddress: string;
  seed: string;
};

export type XRPAccountInfo = {
  account_data?: {
    Account: string;
    Balance: string;
    Sequence: number;
  };
};

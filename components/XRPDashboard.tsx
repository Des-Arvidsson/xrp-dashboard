"use client";

import { useState, useEffect } from "react";
import {
  generateWallet,
  XRPWallet,
  XRPAccountInfo,
  streamAccount,
} from "@/lib/xrpl";

interface XRPTransaction {
  TransactionType: string;
  Amount?: string;
  Destination?: string;
  hash: string;
}

export default function XRPDashboard() {
  const [wallet, setWallet] = useState<XRPWallet | null>(null);
  const [address, setAddress] = useState("");
  const [accountInfo, setAccountInfo] = useState<XRPAccountInfo | null>(null);
  const [txHistory, setTxHistory] = useState<XRPTransaction[]>([]);
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [txResult, setTxResult] = useState<any>(null);

  // Live subscription to XRPL transactions
  useEffect(() => {
    if (!address) return;
    const unsubscribe = streamAccount(address, (tx) => {
      console.log("Live transaction received:", tx);
      setTxHistory((prev) => [tx.transaction, ...prev]);
      setAccountInfo((prev) => {
        if (!prev || !prev.account_data) return prev;
        return {
          ...prev,
          account_data: {
            ...prev.account_data,
            Balance: tx.transaction.Amount ?? prev.account_data.Balance,
            Account: prev.account_data.Account,
            Sequence: prev.account_data.Sequence,
          },
        };
      });
    });
    return () => {
      unsubscribe();
    };
  }, [address]);

  const fetchAccountInfo = async () => {
    if (!address) return;
    const res = await fetch(`/api/account/${address}`);
    const data: XRPAccountInfo = await res.json();
    setAccountInfo(data);
  };

  const createWallet = () => {
    const newWallet = generateWallet();
    if (!newWallet.seed) {
      alert("Failed to generate wallet seed.");
      return;
    }
    setWallet({
      ...newWallet,
      seed: newWallet.seed,
    });
    setAddress(newWallet.classicAddress);
    setAccountInfo(null);
    setTxHistory([]);
    setTxResult(null);
  };

  const sendPayment = async () => {
    if (!wallet) return alert("Generate a wallet first!");
    const res = await fetch("/api/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: wallet.seed,
        destination,
        amount,
      }),
    });
    const data = await res.json();
    setTxResult(data);
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-center">
        XRP Ledger Dashboard (Live)
      </h1>

      {/* Wallet Controls */}
      <div className="flex justify-center space-x-4">
        <button
          className="bg-green-500 text-white px-4 py-2 rounded"
          onClick={createWallet}
        >
          Generate Wallet
        </button>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={fetchAccountInfo}
        >
          Refresh Account Info
        </button>
      </div>

      {/* Wallet Info */}
      {wallet && (
        <div className="bg-gray-100 p-4 rounded space-y-2">
          <h2 className="font-semibold">Wallet Info</h2>
          <p>
            <strong>Address:</strong> {wallet.classicAddress}
          </p>
          <p>
            <strong>Secret:</strong> {wallet.seed}
          </p>
        </div>
      )}

      {/* Account Info */}
      {accountInfo && (
        <div className="bg-gray-50 p-4 rounded">
          <h2 className="font-semibold">Account Info</h2>
          <p>
            <strong>Balance:</strong>{" "}
            {accountInfo.account_data?.Balance
              ? Number(accountInfo.account_data.Balance) / 1_000_000
              : 0}{" "}
            XRP
          </p>
          <pre className="overflow-x-auto">
            {JSON.stringify(accountInfo, null, 2)}
          </pre>
        </div>
      )}

      {/* Send Payment */}
      <div className="bg-gray-50 p-4 rounded space-y-2">
        <h2 className="font-semibold">Send XRP</h2>
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Destination Address"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="border p-2 flex-1"
          />
          <input
            type="text"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="border p-2 w-32"
          />
          <button
            className="bg-purple-500 text-white px-4 py-2 rounded"
            onClick={sendPayment}
          >
            Send
          </button>
        </div>
        {txResult && (
          <pre className="bg-gray-100 p-2 rounded overflow-x-auto">
            {JSON.stringify(txResult, null, 2)}
          </pre>
        )}
      </div>

      {/* Transaction History */}
      {txHistory.length > 0 && (
        <div className="bg-gray-50 p-4 rounded">
          <h2 className="font-semibold">Transaction History (Live)</h2>
          <ul className="space-y-2 max-h-64 overflow-y-auto">
            {txHistory.map((tx, idx) => (
              <li key={idx} className="border p-2 rounded">
                <p>
                  <strong>Type:</strong> {tx.TransactionType}
                </p>
                <p>
                  <strong>Amount:</strong>{" "}
                  {tx.Amount ? Number(tx.Amount) / 1_000_000 + " XRP" : "N/A"}
                </p>
                <p>
                  <strong>Destination:</strong> {tx.Destination || "N/A"}
                </p>
                <p>
                  <strong>Hash:</strong> {tx.hash}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { InputForm } from "./ui/Inputfield";
import {
  chainsToCUSDC,
  SimpleConfidentialTokenAbi,
} from "../constant";
import {
  useChainId,
  useConfig,
  useAccount,
  useWriteContract,
} from "wagmi";
import {
  waitForTransactionReceipt,
  readContract,
} from "@wagmi/core";
import { encryptValue, getExecutorFee } from "../utils/encryption";
import { formatEther, parseGwei } from "viem";

interface TransactionStatus {
  recipient: string;
  amount: string;
  status: "pending" | "success" | "error";
  hash?: string;
  error?: string;
}

const ConfidentialSalaryPage = () => {
  const [tokenadd, setTokenAdd] = useState("");
  const [recipients, setRecipients] = useState("");
  const [amounts, setAmounts] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [incoReady, setIncoReady] = useState(false);
  const [transactions, setTransactions] = useState<TransactionStatus[]>([]);
  const [executorFee, setExecutorFee] = useState<bigint>(0n);
  const [balance, setBalance] = useState<string>("0");

  const chainId = useChainId();
  const config = useConfig();
  const account = useAccount();
  const { writeContractAsync } = useWriteContract();

  // 9 decimals (GWEI-style)
  const decimals = 9;

  // Check encrypted balance handle (just to confirm contract works)
  useEffect(() => {
    const checkBalance = async () => {
      const tokenAddress =
        (tokenadd as `0x${string}`) ||
        (chainsToCUSDC[chainId]?.cusdc as `0x${string}` | undefined);
      if (!tokenAddress || !account.address) return;

      try {
        const bal = await readContract(config, {
          address: tokenAddress,
          abi: SimpleConfidentialTokenAbi,
          functionName: "balanceOf",
          args: [account.address],
        });

        console.log("Balance handle:", bal);
        setBalance("Encrypted (handle only)");
      } catch (error) {
        console.error("Failed to check balance:", error);
      }
    };
    checkBalance();
  }, [tokenadd, account.address, chainId, config]);

  // Initialize Inco + fetch executor fee (for display only)
  useEffect(() => {
    const init = async () => {
      try {
        const fee = await getExecutorFee();
        setExecutorFee(fee);
        setIncoReady(true);
        console.log(" Inco initialized successfully");
        console.log(
          "💰 Executor fee per ciphertext:",
          formatEther(fee),
          "ETH",
        );
      } catch (err) {
        console.error(" Failed to initialize Inco:", err);
      }
    };
    init();
  }, []);

  const parseInputs = () => {
    const recipientList = recipients
      .split(/[,\n]+/)
      .map((addr) => addr.trim())
      .filter((addr) => addr !== "");

    const amountList = amounts
      .split(/[,\n]+/)
      .map((amt) => amt.trim())
      .filter((amt) => amt !== "");

    return { recipientList, amountList };
  };

  const calculateTotal = () => {
    const { amountList } = parseInputs();
    return amountList.reduce((sum, amt) => {
      const num = parseFloat(amt);
      return sum + (isNaN(num) ? 0 : num);
    }, 0);
  };

  async function sendConfidentialPayments() {
    if (!incoReady) {
      alert("Encryption system not ready yet. Please wait...");
      return;
    }

    if (!account.address) {
      alert("Please connect your wallet");
      return;
    }

    const { recipientList, amountList } = parseInputs();

    if (!recipientList.length || !amountList.length) {
      alert("Please enter recipients and amounts");
      return;
    }

    if (recipientList.length !== amountList.length) {
      alert("Number of recipients must match number of amounts");
      return;
    }

    const tokenAddress =
      (tokenadd as `0x${string}`) ||
      (chainsToCUSDC[chainId]?.cusdc as `0x${string}` | undefined);

    if (!tokenAddress) {
      alert("Please enter a valid token address");
      return;
    }

    setIsProcessing(true);

    const initialStatuses: TransactionStatus[] = recipientList.map(
      (recipient, idx) => ({
        recipient,
        amount: amountList[idx],
        status: "pending",
      }),
    );
    setTransactions(initialStatuses);

    for (let i = 0; i < recipientList.length; i++) {
      const recipient = recipientList[i] as `0x${string}`;
      const rawAmount = amountList[i];

      try {
        console.log(
          `Processing payment ${i + 1}/${recipientList.length}...`,
        );

        const amountInGwei = parseGwei(rawAmount); 
        console.log("💵Payment details:", {
          recipient,
          amountInTokens: rawAmount,
          amountInGwei: amountInGwei.toString(),
          decimals,
        });

        // Encrypt amount for this token contract
        const encryptedData = await encryptValue({
          value: amountInGwei,
          address: account.address,
          contractAddress: tokenAddress,
        });

        console.log("Encrypted data:", encryptedData);
        console.log(
          " Executor fee (contract-paid, for info):",
          formatEther(executorFee),
          "ETH",
        );

       
        // Contract pays Inco fee from its own ETH balance.
        const hash = await writeContractAsync({
          abi: SimpleConfidentialTokenAbi,
          address: tokenAddress,
          functionName: "transfer",
          args: [recipient, encryptedData],
        });

        console.log(" Transaction sent:", hash);

        const receipt = await waitForTransactionReceipt(config, { hash });
        console.log(" Transaction confirmed:", receipt);

        setTransactions((prev) =>
          prev.map((tx, idx) =>
            idx === i ? { ...tx, status: "success", hash } : tx,
          ),
        );
      } catch (error: any) {
        console.error(` Payment ${i + 1} failed:`, error);

        setTransactions((prev) =>
          prev.map((tx, idx) =>
            idx === i
              ? {
                  ...tx,
                  status: "error",
                  error:
                    error?.shortMessage ||
                    error?.message ||
                    "Transaction failed",
                }
              : tx,
          ),
        );
      }
    }

    setIsProcessing(false);
    console.log("🏁 All payments processed!");
  }

  const totalAmount = calculateTotal();
  const { recipientList } = parseInputs();

  return (
    <section className="flex items-center justify-center mt-[3%]">
      <main className="w-full md:max-w-[700px] space-y-5 border-[#FFFFFF1A] border-2 rounded-2xl p-5">
        <h1 className="text-center font-bold w-full text-3xl">
          Comfypay 
        </h1>

        {!incoReady && (
          <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-3 text-sm">
             Initializing Inco encryption system...
          </div>
        )}

        {incoReady && (
          <div className="bg-green-500/20 border border-green-500 rounded-lg p-3 text-sm">
             Inco ready! Executor fee per ciphertext (for info):{" "}
            {formatEther(executorFee)} ETH
            <br />
            <span className="text-xs text-gray-300">
              Fees are paid by the token contract from its ETH balance.
            </span>
          </div>
        )}

        <div className="text-xs text-gray-400">
          Your current encrypted balance: {balance}
        </div>

        <InputForm
          label="Token Address (SimpleConfidentialToken)"
          placeholder="0x... (your deployed token address)"
          value={tokenadd}
          onChange={(e) => setTokenAdd(e.target.value)}
        />

        <div className="text-sm text-gray-400 bg-blue-500/10 p-3 rounded-lg border border-blue-500/30">
          Token uses 9 decimals (GWEI). Enter amounts like: 1, 5, 10 (for 1, 5, 10 tokens).
        </div>

        <InputForm
          label="Employee Addresses"
          placeholder="0x123..., 0x456... (comma or newline separated)"
          value={recipients}
          onChange={(e) => setRecipients(e.target.value)}
          large
        />

        <InputForm
          label="Amounts (in tokens)"
          placeholder="1, 2, 3... (comma or newline separated)"
          value={amounts}
          onChange={(e) => setAmounts(e.target.value)}
          large
        />

        <div className="border-[#FFFFFF1A] border-2 rounded-2xl p-5">
          <h1 className="text-lg font-bold mb-5">Transaction Summary</h1>
          <div className="flex items-center justify-between mb-2">
            <span>Number of Recipients:</span>
            <span className="font-bold">{recipientList.length}</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span>Total Amount:</span>
            <span className="font-bold">
              {totalAmount.toFixed(2)} tokens
            </span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span>Executor Fee (per ciphertext):</span>
            <span className="font-bold">
              {formatEther(executorFee)} ETH
            </span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-[#FFFFFF1A]">
            <span className="font-bold">Who Pays Fees?</span>
            <span className="font-bold text-yellow-400">
              Token contract (contract-paid mode)
            </span>
          </div>
        </div>

        {transactions.length > 0 && (
          <div className="border-[#FFFFFF1A] border-2 rounded-2xl p-5 max-h-60 overflow-y-auto">
            <h2 className="text-lg font-bold mb-3">Payment Status</h2>
            {transactions.map((tx, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-2 border-b border-[#FFFFFF1A] last:border-0"
              >
                <div className="flex-1">
                  <div className="text-sm font-mono">
                    {tx.recipient.slice(0, 6)}...
                    {tx.recipient.slice(-4)}
                  </div>
                  <div className="text-xs text-gray-400">
                    {tx.amount} tokens
                  </div>
                </div>
                <div>
                  {tx.status === "pending" && (
                    <span className="text-yellow-500">Pending</span>
                  )}
                  {tx.status === "success" && (
                    <a
                      href={`https://sepolia.basescan.org/tx/${tx.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-500 hover:underline"
                    >
                       Success
                    </a>
                  )}
                  {tx.status === "error" && (
                    <span
                      className="text-red-500 cursor-help"
                      title={tx.error}
                    >
                       Failed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={sendConfidentialPayments}
          disabled={
            isProcessing || !incoReady || parseInputs().recipientList.length === 0
          }
          className={`p-3 rounded-2xl w-full text-center font-medium text-xl transition-all ${
            isProcessing || !incoReady || parseInputs().recipientList.length === 0
              ? "bg-gray-600 cursor-not-allowed opacity-50"
              : "bg-[#0D7534] hover:bg-[#17D45C] hover:text-white cursor-pointer"
          }`}
        >
          {isProcessing
            ? "Processing Payments..."
            : !incoReady
            ? "Initializing..."
            : `Send ${recipientList.length} Payment${
                recipientList.length !== 1 ? "s" : ""
              }`}
        </button>
      </main>
    </section>
  );
};

export default ConfidentialSalaryPage;

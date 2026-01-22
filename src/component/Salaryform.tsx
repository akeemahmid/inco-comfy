"use client";
import { useEffect, useState } from "react";
import { InputForm } from "./ui/Inputfield";
import { chainsToCUSDC, cUSDCAbi } from "../constant";
import {
  useChainId,
  useConfig,
  useAccount,
  useWriteContract,
  useReadContract,
} from "wagmi";
import { waitForTransactionReceipt, readContract } from "@wagmi/core";
import { encryptValue, getFee, getIncoConfig } from "../utils/encryption";
import { formatEther, parseUnits } from "viem";

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
  const [fee, setFee] = useState<string>("0");
  const [decimals, setDecimals] = useState<number>(6);
  const [balance, setBalance] = useState<string>("0");

  
  const chainId = useChainId();
  const config = useConfig();
  const account = useAccount();
  const { writeContractAsync } = useWriteContract();

  useEffect(() => {
    const checkBalance = async () => {
      if (!tokenadd || !account.address) return;
      
      try {
        const bal = await readContract(config, {
          address: tokenadd as `0x${string}`,
          abi: cUSDCAbi,
          functionName: "balanceOf",
          args: [account.address],
        });
        
        console.log("Balance handle:", bal);
        setBalance("Balance is encrypted - can't display");
      } catch (error) {
        console.error("Failed to check balance:", error);
      }
    };
    checkBalance();
  }, [tokenadd, account.address, config]);

  // Initialize Inco when component mounts
  useEffect(() => {
    const initInco = async () => {
      try {
        await getIncoConfig();
        const feeAmount = await getFee();
        setFee(formatEther(feeAmount).toString());
        setIncoReady(true);
        console.log(" Inco initialized successfully");
      } catch (error) {
        console.error("Failed to initialize Inco:", error);
      }
    };
    initInco();
  }, []);

  // Fetch decimals when token address changes
  useEffect(() => {
    const fetchDecimals = async () => {
      if (!tokenadd) return;

      try {
        const tokenDecimals = await readContract(config, {
          address: tokenadd as `0x${string}`,
          abi: cUSDCAbi,
          functionName: "decimals",
        });
        setDecimals(Number(tokenDecimals));
        console.log(`Token decimals: ${tokenDecimals}`);
      } catch (error) {
        console.error("Failed to fetch decimals:", error);
        setDecimals(6);
      }
    };
    fetchDecimals();
  }, [tokenadd, config]);

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

    if (recipientList.length === 0 || amountList.length === 0) {
      alert("Please enter recipients and amounts");
      return;
    }

    if (recipientList.length !== amountList.length) {
      alert("Number of recipients must match number of amounts");
      return;
    }

    const cUSDCAddress = tokenadd || chainsToCUSDC[chainId]?.cusdc;
    if (!cUSDCAddress) {
      alert("Please enter a cUSDC token address");
      return;
    }

    setIsProcessing(true);
    const txStatuses: TransactionStatus[] = recipientList.map(
      (recipient, idx) => ({
        recipient,
        amount: amountList[idx],
        status: "pending" as const,
      }),
    );
    setTransactions(txStatuses);

    for (let i = 0; i < recipientList.length; i++) {
      try {
        console.log(
          ` Processing payment ${i + 1}/${recipientList.length}...`,
        );

        const amountInWei = parseUnits(amountList[i], decimals);
        console.log(
          `Amount: ${amountList[i]} tokens = ${amountInWei.toString()} wei (decimals: ${decimals})`,
        );

        const encryptedData = await encryptValue({
          value: amountInWei,
          address: account.address,
          contractAddress: cUSDCAddress as `0x${string}`,
        });

        console.log("Encrypted data:", encryptedData);

        const hash = await writeContractAsync({
          abi: cUSDCAbi,
          address: cUSDCAddress as `0x${string}`,
          functionName: "encryptedTransfer",
          args: [recipientList[i] as `0x${string}`, encryptedData],
        });

        await waitForTransactionReceipt(config, { hash });

        setTransactions((prev) =>
          prev.map((tx, idx) =>
            idx === i ? { ...tx, status: "success", hash } : tx,
          ),
        );

        console.log(` Payment ${i + 1} successful:`, hash);
      } catch (error: any) {
        console.error(`Payment ${i + 1} failed:`, error);

        setTransactions((prev) =>
          prev.map((tx, idx) =>
            idx === i
              ? {
                  ...tx,
                  status: "error",
                  error: error.message || "Transaction failed",
                }
              : tx,
          ),
        );
      }
    }

    setIsProcessing(false);
    alert("All payments processed! Check individual statuses below.");
  }

  const totalAmount = calculateTotal();
  const { recipientList, amountList } = parseInputs();

  return (
    <section className="flex items-center justify-center mt-[3%]">
      <main className="w-full md:max-w-[700px] space-y-5 border-[#FFFFFF1A] border-2 rounded-2xl p-5">
        <h1 className="text-center font-bold w-full text-3xl">
          Comfypay 
        </h1>

        {/* {!incoReady && (
          <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-3 text-sm">
            Initializing Inco encryption system...
          </div>
        )}

        {incoReady && (
          <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-3 text-sm">
            Inco ready! Fee per transaction: {fee} ETH
          </div>
        )} */}

        <InputForm
          label="cUSDC Token Address"
          placeholder="0x... (cUSDC contract address)"
          value={tokenadd}
          onChange={(e) => setTokenAdd(e.target.value)}
        />

        {tokenadd && (
          <div className="text-sm text-gray-400">
            Token decimals: {decimals}
          </div>
        )}

        <InputForm
          label="Employees Address"
          placeholder="0x123..., 0x456..."
          value={recipients}
          onChange={(e) => setRecipients(e.target.value)}
          large={true}
        />

        <InputForm
          label="Amounts"
          placeholder="100, 200, 300..."
          value={amounts}
          onChange={(e) => setAmounts(e.target.value)}
          large={true}
        />

        <div className="border-[#FFFFFF1A] border-2 rounded-2xl p-5">
          <h1 className="text-lg font-bold mb-5">Transaction Details</h1>
          <div className="flex items-center justify-between">
            <span>Recipients:</span>
            <span>{recipientList.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Total Amount:</span>
            <span>{totalAmount} tokens</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Total Fees:</span>
            <span>
              {(parseFloat(fee) * recipientList.length).toFixed(6)} ETH
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
                    {tx.recipient.slice(0, 6)}...{tx.recipient.slice(-4)}
                  </div>
                  <div className="text-xs text-gray-400">
                    {tx.amount} tokens
                  </div>
                </div>
                <div>
                  {tx.status === "pending" && (
                    <span className="text-yellow-500">⏳ Pending</span>
                  )}
                  {tx.status === "success" && ( <a
                    
                      href={`https://sepolia.basescan.org/tx/${tx.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-500 hover:underline"
                    >
                      Success
                    </a>
                  )}
                  {tx.status === "error" && (
                    <span className="text-red-500" title={tx.error}>
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
          disabled={isProcessing || !incoReady || recipientList.length === 0}
          className={`p-3 rounded-2xl w-full text-center font-medium text-xl ${
            isProcessing || !incoReady || recipientList.length === 0
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-[#0D7534] hover:bg-[#17D45C] hover:text-white cursor-pointer"
          }`}
        >
          {isProcessing
            ? "Processing Payments..."
            : !incoReady
              ? "Initializing..."
              : "Send Confidential Payments"}
        </button>
      </main>
    </section>
  );
};

export default ConfidentialSalaryPage;
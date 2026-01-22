// utils/encryption.ts
import { Lightning } from "@inco/js/lite";
import { handleTypes } from "@inco/js";
import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import type { WalletClient } from "viem";

export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

let incoInstance: any = null;

export async function getIncoConfig() {
  if (!incoInstance) {
    const chainId = publicClient.chain.id;
    incoInstance = await Lightning.latest("testnet", chainId);
    console.log("🔧 Inco instance created:", {
      executorAddress: incoInstance.executorAddress,
      chainId,
    });
  }
  return incoInstance;
}

export async function encryptValue({
  value,
  address,
  contractAddress,
}: {
  value: bigint;
  address: `0x${string}`;
  contractAddress: `0x${string}`;
}): Promise<`0x${string}`> {
  const inco = await getIncoConfig();

  console.log("🔐 Encrypting value:", {
    value: value.toString(),
    accountAddress: address,
    dappAddress: contractAddress,
    handleType: handleTypes.euint256,
  });

  const encryptedData = await inco.encrypt(value, {
    accountAddress: address,
    dappAddress: contractAddress,
    handleType: handleTypes.euint256,
  });

  console.log("Encrypted data generated:", encryptedData);

  return encryptedData as `0x${string}`;
}

export async function decryptValue({
  walletClient,
  handle,
}: {
  walletClient: WalletClient;
  handle: string;
}): Promise<bigint> {
  const inco = await getIncoConfig();
  const attestedDecrypt = await inco.attestedDecrypt(walletClient, [
    handle as `0x${string}`,
  ]);
  return attestedDecrypt[0].plaintext.value as bigint;
}


export async function getExecutorFee(): Promise<bigint> {
  const inco = await getIncoConfig();
  try {
    const fee = await publicClient.readContract({
      address: inco.executorAddress,
      abi: [
        {
          type: "function",
          inputs: [],
          name: "getFee",
          outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
          stateMutability: "pure",
        },
      ],
      functionName: "getFee",
    });
    console.log(" Executor fee:", fee.toString());
    return fee as bigint;
  } catch (error) {
    console.error(" Failed to get executor fee:", error);
    throw error;
  }
}

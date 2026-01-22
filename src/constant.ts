// constant.ts
interface TokenConfig {
  [chainId: number]: {
    cusdc: string;
  };
}

export const chainsToToken: TokenConfig = {
  84532: {
    cusdc: "0x49bC3646067973a3De9Bbf210050020e9c88aF04", 
  },
};

export const chainsToCUSDC = chainsToToken;

// ABI for SimpleConfidentialToken 
export const SimpleConfidentialTokenAbi = [
  {
    inputs: [
      { internalType: "address", name: "", type: "address" },
    ],
    name: "balanceOf",
    outputs: [
      { internalType: "euint256", name: "", type: "bytes32" },
    ],
    stateMutability: "view",
    type: "function",
  },
  // transfer(address,bytes) – NO payable
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "bytes",   name: "valueInput", type: "bytes" },
    ],
    name: "transfer",
    outputs: [
      { internalType: "ebool", name: "", type: "bytes32" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  // owner()
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  // getIncoFee()
  {
    inputs: [],
    name: "getIncoFee",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  // depositFees()
  {
    inputs: [],
    name: "depositFees",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
] as const;

export const cUSDCAbi = SimpleConfidentialTokenAbi;

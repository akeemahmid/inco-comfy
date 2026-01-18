// constant-cerc20.ts

interface CERC20Config {
    [chainId: number]: {
        cusdc: string // Confidential USDC address
    }
}

// Base Sepolia with Inco's cUSDC
export const chainsToCUSDC: CERC20Config = {
    84532: {
        cusdc: "0x7bad07b6b6064dfb033207794625ffa4322cb392", 
    },
}

// Confidential USDC (cUSDC) ABI
export const cUSDCAbi = [
    // Read Functions
    {
        inputs: [
            {
                internalType: "address",
                name: "wallet",
                type: "address",
            },
        ],
        name: "balanceOf",
        outputs: [
            {
                internalType: "euint256",
                name: "",
                type: "bytes32",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "owner",
                type: "address",
            },
            {
                internalType: "address",
                name: "spender",
                type: "address",
            },
        ],
        name: "allowance",
        outputs: [
            {
                internalType: "euint256",
                name: "",
                type: "bytes32",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "name",
        outputs: [
            {
                internalType: "string",
                name: "",
                type: "string",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "symbol",
        outputs: [
            {
                internalType: "string",
                name: "",
                type: "string",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "decimals",
        outputs: [
            {
                internalType: "uint8",
                name: "",
                type: "uint8",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    
    // Encrypted Write Functions
    {
        inputs: [
            {
                internalType: "address",
                name: "to",
                type: "address",
            },
            {
                internalType: "bytes",
                name: "encryptedAmount",
                type: "bytes",
            },
        ],
        name: "encryptedTransfer",
        outputs: [
            {
                internalType: "bool",
                name: "",
                type: "bool",
            },
        ],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "spender",
                type: "address",
            },
            {
                internalType: "bytes",
                name: "encryptedAmount",
                type: "bytes",
            },
        ],
        name: "encryptedApprove",
        outputs: [
            {
                internalType: "bool",
                name: "",
                type: "bool",
            },
        ],
        stateMutability: "nonpayable",
        type: "function",
    },
    
    // Events
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "address",
                name: "from",
                type: "address",
            },
            {
                indexed: true,
                internalType: "address",
                name: "to",
                type: "address",
            },
        ],
        name: "Transfer",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "address",
                name: "owner",
                type: "address",
            },
            {
                indexed: true,
                internalType: "address",
                name: "spender",
                type: "address",
            },
        ],
        name: "Approval",
        type: "event",
    },
] as const;
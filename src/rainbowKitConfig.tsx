import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { baseSepolia } from '@wagmi/core/chains';

export const config = getDefaultConfig({
  appName: 'Confidential Comfypay',
  projectId: 'YOUR_WALLET_CONNECT_PROJECT_ID',
  chains: [baseSepolia],
  ssr: true,
});
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createConfig, http, WagmiProvider } from "wagmi";
import { ReactNode } from "react";
import { metaMask } from "wagmi/connectors";

export const connectors = [metaMask()];

const queryClient = new QueryClient();

const chain = {
  id: 1924,
  name: 'Swellchain Testnet',
  network: 'swell-testnet',
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://swell-testnet.alt.technology'],
    },
    public: {
      http: ['https://swell-testnet.alt.technology'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Swell Testnet Explorer',
      url: 'https://swell-testnet-explorer.alt.technology',
    },
  },
};



export const wagmiConfig = createConfig({
  chains: [chain],
  connectors,
  multiInjectedProviderDiscovery: false,
  transports: {
    [chain.id]: http(),
  },
});

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        {children}
      </WagmiProvider>
    </QueryClientProvider>
  );
} 
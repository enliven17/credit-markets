"use client";
import "@rainbow-me/rainbowkit/styles.css";
import React from "react";
import { WagmiProvider, http } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, getDefaultConfig, darkTheme } from "@rainbow-me/rainbowkit";
import { creditcoinTestnet } from "@/config/creditcoin";

const queryClient = new QueryClient();

// Add safety check for creditcoinTestnet
if (!creditcoinTestnet) {
  console.error("creditcoinTestnet is undefined");
  throw new Error("creditcoinTestnet configuration is missing");
}

console.log("creditcoinTestnet config:", creditcoinTestnet);

const wagmiConfig = getDefaultConfig({
  appName: "Credit Predict",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo",
  chains: [creditcoinTestnet as any],
  transports: {
    [creditcoinTestnet.id]: http(creditcoinTestnet.rpcUrls.default.http[0]),
  },
  ssr: true,
}) as any;

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme({ accentColor: "#16a34a" })}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
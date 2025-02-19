import {
    getDefaultConfig,
    RainbowKitProvider,
} from "@rainbow-me/rainbowkit";
import { WagmiProvider } from 'wagmi';
import "@rainbow-me/rainbowkit/styles.css";
import { arbitrum, sepolia } from 'wagmi/chains';
import { http } from 'wagmi';
import {
    QueryClientProvider,
    QueryClient,
  } from "@tanstack/react-query";

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

if (!projectId) {
    throw new Error(
        "WalletConnect Project ID is required. Please add VITE_WALLETCONNECT_PROJECT_ID to your .env file"
    );
}

const config = getDefaultConfig({
    appName: 'Nest AI',
    projectId,
    chains: [arbitrum, sepolia],
    transports: {
        [arbitrum.id]: http(),
        [sepolia.id]: http(),
    },
});

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: Number.POSITIVE_INFINITY,
        },
    },
});

export function Web3Provider({ children }: { children: React.ReactNode }) {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider>
                    {children}
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}

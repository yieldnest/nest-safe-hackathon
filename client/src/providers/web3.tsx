import {
    connectorsForWallets,
    getDefaultWallets,
    RainbowKitProvider,
} from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { sepolia } from "viem/chains";
import { configureChains, createConfig, WagmiConfig } from "wagmi";
import { jsonRpcProvider } from "wagmi/providers/jsonRpc";

// Configure chains & providers
const { chains, publicClient } = configureChains(
    [sepolia],
    [
        jsonRpcProvider({
            rpc: () => ({
                http: sepolia.rpcUrls.default.http[0],
            }),
        }),
    ]
);

// Set up wallet connectors
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

if (!projectId) {
    throw new Error(
        "WalletConnect Project ID is required. Please add VITE_WALLETCONNECT_PROJECT_ID to your .env file"
    );
}

const { wallets } = getDefaultWallets({
    appName: "Nest Safe",
    projectId,
    chains,
});

const connectors = connectorsForWallets([...wallets]);

// Create wagmi config
const config = createConfig({
    autoConnect: true,
    connectors,
    publicClient,
});

// Web3 provider component
export function Web3Provider({ children }: { children: React.ReactNode }) {
    return (
        <WagmiConfig config={config}>
            <RainbowKitProvider chains={chains}>{children}</RainbowKitProvider>
        </WagmiConfig>
    );
}

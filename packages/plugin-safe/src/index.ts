import { Plugin } from "@elizaos/core";
import { createSafeAction } from "./actions/create-safe";
import { safeWalletProvider } from "./providers/safe-wallet";

export const safePlugin: Plugin = {
    name: "safe",
    description: "Safe wallet integration plugin for creating and managing Safe smart contract wallets",
    actions: [createSafeAction],
    providers: [safeWalletProvider],
    evaluators: [],
    services: []
}; 
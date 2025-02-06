import { Plugin } from "@elizaos/core";
import { createSafeAction } from "./actions/create-safe";
import { safeWalletProvider } from "./providers/safe-wallet";

console.log("[SafePlugin] Initializing Safe plugin...");
console.log("[SafePlugin] Registering actions:", createSafeAction.name);
console.log("[SafePlugin] Registering providers:", "safeWalletProvider");

export const safePlugin: Plugin = {
    name: "safe",
    description: "Safe wallet integration plugin for creating and managing Safe smart contract wallets",
    actions: [createSafeAction],
    providers: [safeWalletProvider],
    evaluators: [],
    services: []
}; 
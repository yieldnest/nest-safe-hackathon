import type { Plugin } from "@elizaos/core";
import { getVaultYieldsForUserAction, generateVaultTxAction } from "./actions";

export const vaultsFyiPlugin: Plugin = {
    name: "vaults_fyi",
    description: "Vaults FYI plugin",
    providers: [],
    evaluators: [],
    services: [],
    actions: [
        getVaultYieldsForUserAction,
        generateVaultTxAction
    ],
};

export default vaultsFyiPlugin;

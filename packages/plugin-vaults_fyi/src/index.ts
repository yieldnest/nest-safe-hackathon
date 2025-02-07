import type { Plugin } from "@elizaos/core";
import {
    getVaultYieldsForUserAction,
    getAllVaultsAction,
    analyzeYieldTokenAction,
} from "./actions";

export const vaultsFyiPlugin: Plugin = {
    name: "vaults_fyi",
    description: "Vaults FYI plugin",
    providers: [],
    evaluators: [],
    services: [],
    actions: [
        getVaultYieldsForUserAction,
        getAllVaultsAction,
        analyzeYieldTokenAction,
    ],
};

export default vaultsFyiPlugin;

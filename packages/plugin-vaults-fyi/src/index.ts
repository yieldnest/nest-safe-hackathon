import type { Plugin } from "@elizaos/core";
import {
    analyzeYieldTokenAction,
    getAllVaultsAction,
    getVaultYieldsForUserAction,
} from "./actions";

export const vaultsFyiPlugin: Plugin = {
    name: "vaults-fyi",
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

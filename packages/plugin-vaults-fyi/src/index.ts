import type { Plugin } from "@elizaos/core";
import { analyzeYieldTokenAction, getAllVaultsAction } from "./actions";

export const vaultsFyiPlugin: Plugin = {
    name: "vaults-fyi",
    description: "Vaults FYI plugin",
    providers: [],
    evaluators: [],
    services: [],
    actions: [getAllVaultsAction, analyzeYieldTokenAction],
};

export default vaultsFyiPlugin;

import { Action, IAgentRuntime, Memory, State } from "@elizaos/core";
import { initVaultsFyiApi } from "../api/vaults-api";
import { Chains } from "../types";

export const getAllVaultsAction: Action = {
    name: "GET_ALL_VAULTS",
    description: "Use this action if you need to get broad info about yield farming opportunities in DeFi.",  
    handler: async (
        runtime: IAgentRuntime, 
        _message: Memory, 
        _state: State, 
        options: { network: Chains } = { network: 'arbitrum' }, 
        callback
    ) => {
        const vaultsFyiApi = initVaultsFyiApi(runtime);
        const vaults = await vaultsFyiApi.getAllVaults(options.network);

        if (!vaults) {
            callback({
                text: "Failed to get all vaults",
            });
            return;
        }
        
        callback({
            text: JSON.stringify(vaults),
        });
    },
    similes: [],
    examples: [],
    validate: async (runtime: IAgentRuntime) => {
        const vaultsFyiApiKey = runtime.getSetting("VAULTS_FYI_API_KEY");
        return typeof vaultsFyiApiKey === "string";
    },
}
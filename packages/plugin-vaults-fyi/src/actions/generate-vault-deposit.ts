import { Action, IAgentRuntime, Memory, State } from "@elizaos/core";
import { initVaultsFyiApi } from "../api/vaults-api";

export const generateVaultTxAction: Action = {
    name: "GENERATE_VAULT_TX",
    description: "Generate a deposit transaction for a vault",  
    handler: async (
        runtime: IAgentRuntime, 
        _message: Memory, 
        _state: State, 
        options: { vaultAddress: string, senderAddress: string, amount: string }, 
        callback
    ) => {
        const vaultsFyiApi = initVaultsFyiApi(runtime);
        const vaultDepositTx = await vaultsFyiApi.getVaultDepositTx(options.vaultAddress, options.senderAddress, options.amount);

        if (!vaultDepositTx) {
            callback({
                text: "Failed to generate deposit transaction",
            });
            return;
        }

        callback({
            text: JSON.stringify(vaultDepositTx),
        });
    },
    similes: [],
    examples: [],
    validate: async (runtime: IAgentRuntime) => {
        const vaultsFyiApiKey = runtime.getSetting("VAULTS_FYI_API_KEY");
        return typeof vaultsFyiApiKey === "string";
    },
}
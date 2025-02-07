import {
    Action,
    composeContext,
    generateMessageResponse,
    IAgentRuntime,
    Memory,
    ModelClass,
    parseJSONObjectFromText,
    State,
} from "@elizaos/core";
import { initVaultsFyiApi } from "../api/vaults-api";
import {
    Chains,
    HistoricalApy,
    UserVaultsAnalyzeLLMResponse,
    VaultDetailed,
} from "../types";
import {
    singleVaultAnalysisTemplate,
    singleVaultTextAnalysisTemplate,
} from "../templates";

export const analyzeYieldTokenAction: Action = {
    name: "ANALYZE_YIELD_TOKEN",
    description:
        "Use this action when you want to learn more about a specific yield strategy.",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        _state: State,
        options: { vaultAddress: string; network: Chains } = {
            vaultAddress: "",
            network: "arbitrum",
        },
        callback
    ) => {
        if (!options.vaultAddress) {
            callback({
                text: "Vault address is required",
            });
            return;
        }

        const vaultsFyiApi = initVaultsFyiApi(runtime);
        const vault = await vaultsFyiApi.getVault(options.vaultAddress);

        if (!vault) {
            callback({
                text: "Failed to get vault data",
            });
            return;
        }

        const apyData = await vaultsFyiApi.getHistoricalApy({
            vaultAddress: options.vaultAddress,
            network: options.network,
        });

        if (!apyData) {
            callback({
                text: "Failed to get historical apy data",
            });
            return;
        }

        const response = await analyzeVault(runtime, vault, apyData, message);

        if (!response) {
            callback({
                text: "Failed to analyze vault",
            });
            return;
        }

        const { json, text } = response;

        callback({
            text: text,
            analysis: JSON.stringify(json ?? {}),
        });
    },
    similes: [],
    examples: [],
    validate: async (runtime: IAgentRuntime) => {
        const vaultsFyiApiKey = runtime.getSetting("VAULTS_FYI_API_KEY");
        return typeof vaultsFyiApiKey === "string";
    },
};

const analyzeVault = async (
    runtime: IAgentRuntime,
    vault: VaultDetailed,
    apyData: HistoricalApy[],
    message: Memory
): Promise<{ json: UserVaultsAnalyzeLLMResponse; text: string } | null> => {
    const state = await runtime.composeState(message, {
        vaultData: vault,
        historicalApyData: apyData,
    });

    const contextJson = composeContext({
        state,
        template: singleVaultAnalysisTemplate,
    });

    const responseJson = await generateMessageResponse({
        runtime: runtime,
        context: contextJson,
        modelClass: ModelClass.LARGE,
    });

    // save response to memory
    const responseMessage = {
        ...message,
        userId: runtime.agentId,
        content: responseJson,
    };

    await runtime.messageManager.createMemory(responseMessage);

    if (!responseJson) {
        return null;
    }

    let data = null;

    try {
        data = parseJSONObjectFromText(responseJson.text);
    } catch {
        // we wait a valid json response
        return null;
    }

    const contextText = composeContext({
        state,
        template: singleVaultTextAnalysisTemplate,
    });

    const responseText = await generateMessageResponse({
        runtime: runtime,
        context: contextText,
        modelClass: ModelClass.LARGE,
    });

    if (!responseText) {
        return null;
    }

    return {
        json: data,
        text: responseText.text,
    };
};

import {
    Action,
    composeContext,
    elizaLogger,
    generateText,
    IAgentRuntime,
    Memory,
    ModelClass,
    parseJSONObjectFromText,
    State,
} from "@elizaos/core";
import { initVaultsFyiApi } from "../api/vaults-api";
import {
    extractVaultInfoTemplate,
    optimizedVaultAnalysisTemplate,
} from "../templates";
import { UserVaultsAnalyzeLLMResponse, VaultDetailed } from "../types";

export const analyzeYieldTokenAction: Action = {
    name: "ANALYZE_YIELD_TOKEN",
    description:
        "Use this action when you want to learn more about a specific yield strategy.",
    validate: async (runtime: IAgentRuntime) => {
        const vaultsFyiApiKey = runtime.getSetting("VAULTS_FYI_API_KEY");
        return typeof vaultsFyiApiKey === "string";
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        _state: State,
        _options,
        callback
    ) => {
        const state = await runtime.composeState(message);

        const extractContext = composeContext({
            state,
            template: extractVaultInfoTemplate,
        });

        const vaultInfoResponse = await generateText({
            runtime: runtime,
            context: extractContext,
            modelClass: ModelClass.LARGE,
            customTemperature: 0.1,
        });

        if (!vaultInfoResponse) {
            callback({
                text: "Failed to extract vault information from message",
            });
            return;
        }

        let vaultInfo;
        try {
            vaultInfo = parseJSONObjectFromText(vaultInfoResponse);
        } catch {
            callback({
                text: "Failed to parse vault information",
            });
            return;
        }

        if (!vaultInfo.vaultAddress) {
            callback({
                text: "No vault address found in the message",
            });
            return;
        }

        const vaultsFyiApi = initVaultsFyiApi(runtime);
        const vault = await vaultsFyiApi.getVault(
            vaultInfo.vaultAddress,
            vaultInfo.network || "arbitrum"
        );

        if (!vault) {
            callback({
                text: "Failed to get vault data",
            });
            return;
        }

        // const apyData = await vaultsFyiApi.getHistoricalApy({
        //     vaultAddress: vaultInfo.vaultAddress,
        //     network: vaultInfo.network || "arbitrum",
        // });

        // elizaLogger.info("apyData", apyData);

        // if (!apyData) {
        //     callback({
        //         text: "Failed to get historical apy data",
        //     });
        //     return;
        // }

        const response = await analyzeVault(runtime, vault, message);

        if (!response) {
            callback({
                text: "Failed to analyze vault",
            });
            return;
        }

        const { json, text } = response;

        elizaLogger.info("response in analyze yield token", text);
        elizaLogger.info("response in analyze yield token", json);

        callback({
            text: text,
            analysis: JSON.stringify(json ?? {}),
        });
    },
    similes: [],
    examples: [],
};

const analyzeVault = async (
    runtime: IAgentRuntime,
    vault: VaultDetailed,
    // apyData: HistoricalApy[],
    message: Memory
): Promise<{ json: UserVaultsAnalyzeLLMResponse; text: string } | null> => {
    const state = await runtime.composeState(message, {
        vaultData: JSON.stringify(vault),
        // historicalApyData: apyData,
    });

    const contextJson = composeContext({
        state,
        template: optimizedVaultAnalysisTemplate,
    });

    const responseJson = await generateText({
        runtime: runtime,
        context: contextJson,
        modelClass: ModelClass.LARGE,
    });

    // save response to memory
    const responseMessage = {
        ...message,
        userId: runtime.agentId,
        content: { text: responseJson },
    };

    await runtime.messageManager.createMemory(responseMessage);

    if (!responseJson) {
        return null;
    }

    let data = null;

    try {
        data = parseJSONObjectFromText(responseJson);
    } catch {
        // we wait a valid json response
        return null;
    }

    return {
        json: data,
        text: responseJson,
    };
};

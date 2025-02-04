import { Memory, State, Action, IAgentRuntime, composeContext, generateMessageResponse, ModelClass, parseJSONObjectFromText } from "@elizaos/core";
import { initVaultsFyiApi } from "../api/vaults-api";
import { userVaultsAnalysisTemplate } from '../templates';
import { UserVaultsAnalyzeLLMResponse, VaultDetailed } from "../types";

export const getVaultYieldsForUserAction: Action = {
    name: "GET_VAULT_YIELDS_FOR_USER",
    description: "Get the yields for all the vaults the user fit",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        _state: State,
        options: {
            userAddress: string;
        },
        callback
    ) => {
        const vaultsFyiApi = initVaultsFyiApi(runtime);
        const vaults = await vaultsFyiApi.getVaultsForUser(options.userAddress);

        if (!vaults) {
            return null;
        }

        const analysis = await analyzeVaultOpportunities(runtime, vaults, message);

        if (!analysis) {
            return null;
        }

        callback({
            text: analysis.marketOverview.marketCondition || "",
            stringifiedAnalysis: JSON.stringify(analysis),
            ...analysis,
        });

        return analysis;
    },
    validate: async (runtime: IAgentRuntime) => {
        const vaultsFyiApiKey = runtime.getSetting("VAULTS_FYI_API_KEY");
        return typeof vaultsFyiApiKey === "string";
    },
    examples: [
        [
            {
                user: "user",
                content: {
                    text: "What are the best vaults on the market?",
                    action: "VAULT_YIELDS_FOR_USER",
                    options: {
                        userAddress: "0x123",
                    },
                },
            },
        ],
    ],
    similes: ["AI_AGENT_MARKET_OVERVIEW", "AI_AGENT_MARKET"],
};

export const analyzeVaultOpportunities = async (
    runtime: IAgentRuntime,
    vaults: VaultDetailed[],
    message: Memory
): Promise<UserVaultsAnalyzeLLMResponse | null> => {
    const state = await runtime.composeState(message, {
        vaultsData: vaults,
    });

    const context = composeContext({
        state,
        template: userVaultsAnalysisTemplate,
    });

    const response = await generateMessageResponse({
        runtime: runtime,
        context,
        modelClass: ModelClass.LARGE,
    });

    // save response to memory
    const responseMessage = {
        ...message,
        userId: runtime.agentId,
        content: response,
    };

    await runtime.messageManager.createMemory(responseMessage);

    if (!response) {
        return null;
    }

    let data = null;

    try {
        data = parseJSONObjectFromText(response.text);
    } catch {
        // we wait a valid json response
        return null;
    }

    return data;
};

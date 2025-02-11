import {
    Action,
    ActionExample,
    composeContext,
    generateText,
    IAgentRuntime,
    Memory,
    ModelClass,
    State,
} from "@elizaos/core";
import { initVaultsFyiApi } from "../api/vaults-api";
import { Chains } from "../types";
import { analyzeVaultsTemplate } from "../templates/vaults";

export const getAllVaultsAction: Action = {
    name: "GET_ALL_VAULTS",
    similes: ["GET_YIELD_OPPORTUNITIES", "GET_YIELD_STRATEGIES"],
    description:
        "Use this action if you need to get broad info about yield farming opportunities in DeFi.",
    validate: async (runtime: IAgentRuntime) => {
        const vaultsFyiApiKey = runtime.getSetting("VAULTS_FYI_API_KEY");
        return typeof vaultsFyiApiKey === "string";
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        _state: State,
        options: { network: Chains } = { network: "arbitrum" },
        callback
    ) => {
        const vaultsFyiApi = initVaultsFyiApi(runtime);
        const vaults = await vaultsFyiApi.getAllVaults(options.network);

        const sortedVaults = vaults
            .sort((a, b) => {
                const aApy = a.apy.total["1day"] || 0;
                const bApy = b.apy.total["1day"] || 0;
                return bApy - aApy;
            })
            .slice(0, 20);

        if (!vaults) {
            callback({
                text: "Failed to get all vaults",
            });
            return;
        }

        const stringifiedVaults = JSON.stringify(sortedVaults);

        const state = await runtime.composeState(message, {
            vaults: stringifiedVaults,
            text: message.content.text,
        });

        const context = await composeContext({
            state,
            template: analyzeVaultsTemplate,
        });

        const analyzedVaults = await generateText({
            runtime,
            context: context,
            modelClass: ModelClass.LARGE,
            customTemperature: 0.4,
        });

        callback({
            text: analyzedVaults,
        });
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "What are some good yield farming opportunities right now?",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Here are the current top yield opportunities:\n- Arbitrum USDC.e vault: 5.2% APY\n- GMX GLP vault: 15.8% APY\n- Curve tricrypto: 8.3% APY",
                    action: "GET_ALL_VAULTS",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "looking for stablecoin yield strategies",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Current stablecoin vaults:\n- USDC/USDT LP: 4.8% APY\n- DAI single-sided: 3.9% APY\n- FRAX/USDC: 5.1% APY",
                    action: "GET_ALL_VAULTS",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "show me defi yields on arbitrum",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Arbitrum yield opportunities:\n- Balancer pools: 12-20% APY\n- Radiant lending: 3-8% APY\n- Sushi farms: 15-25% APY",
                    action: "GET_ALL_VAULTS",
                },
            },
        ],
    ] as ActionExample[][],
};

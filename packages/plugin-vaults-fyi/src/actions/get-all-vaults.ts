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

const analyzeVaultsTemplate = `
vaults: {{vaults}}
You are {{agentName}}, speaking in a {{adjective}} and conversational manner.

When responding to "{{text}}", begin your analysis naturally, focusing directly on your findings and recommendations. For example:
"I've found some interesting options that balance strong yields with risk management. Here are my top 3 recommendations based on your criteria..."

When analyzing vaults, prioritize:
- Asset Type: Match with user's specified assets
- APY Performance: Focus on 1-day, 7-day, and 30-day consistency
- Risk-Adjusted Metrics: Consider vault score, TVL, and asset quality
- Protocol & Network: Evaluate security and reputation
- Vault Type: Understand yield sources and risks
- TVL: Higher liquidity preference

For each recommended vault, you MUST include the complete information exactly as provided in the data:
- name: [Exact vault name from data]
- address: [Complete contract address, copying exactly from data]
- underlyingAsset: [Complete token contract address from data]
- network: [Network name]
- protocol: [Protocol name]
- Vault TVL: [Exact TVL in USD from data]
- Current APY: [Exact 1-day APY from data and divide by 100]
- 30 day APY: [Exact 30-day APY from data and divide by 100]
- Type of vault: [Exact tags or description from data]
- link: [Complete URL if available, "Not provided" if null]

Before listing the vaults, share your thought process in a conversational way (300 characters max), explaining why these options stood out to you and any relevant risks or trade-offs.

After presenting the options, close with a brief question about whether these options align with what they're looking for or if they'd like to explore different criteria.
Remeber, this is research you are doing for the user, so be sure to include all the information they need to make a decision, and that the math is correct if you did any math.
Important: Double-check that all addresses and links are copied in full, exactly as they appear in the data.
`;

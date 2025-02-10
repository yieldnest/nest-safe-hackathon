import { Action, HandlerCallback, IAgentRuntime, Memory, State } from "@elizaos/core";
import { validateMoralisConfig } from "../../environment";
import { API_ENDPOINTS } from "../../utils/constants";
import { PairsForTokenPaginated, TopGainer } from "../../types/arbitrum";
import { calculateAPR } from "../../utils/apr";

export const marketOverview: Action = {
    name: "GET_ARBITRUM_MARKET_OVERVIEW",
    similes: [
        "GET_ARBITRUM_MARKET_OVERVIEW",
        "GET_ARBITRUM_MARKET_GAINERS",
        "GET_ARBITRUM_MARKET_GAINERS_POOLS",
        "GET_ARBITRUM_MARKET_TOP_GAINERS",
        "GET_ARBITRUM_MARKET_TOP_GAINERS_POOLS",
    ],
    validate: async (runtime: IAgentRuntime, _message: Memory) => {
        await validateMoralisConfig(runtime);
        return true;
    },
    description: "Get market overview for Arbitrum blockchain",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ) => {
        const config = await validateMoralisConfig(runtime);
        const headers = {
            "X-API-Key": config.MORALIS_API_KEY,
            "Content-Type": "application/json",
        };

        const topGainers = await fetch(API_ENDPOINTS.ARBITRUM.MARKET_GAINERS, {
            headers,
        });

        if (!topGainers.ok) {
            throw new Error("Failed to fetch top gainers");
        }

        const topGainersData = await topGainers.json() as TopGainer[];

        const pairsPromises = topGainersData.map(async (gainer) => {
            const pairsForToken = await fetch(API_ENDPOINTS.ARBITRUM.PAIRS_FOR_TOKEN(gainer.token_address), {
                headers,
            });
            if (!pairsForToken.ok) {
                return [];
            }
            const pairsForTokenData = await pairsForToken.json() as PairsForTokenPaginated;
            return await Promise.all(pairsForTokenData.pairs.filter((pair) => !pair.inactive_pair).map(async (pair) => ({
                ...pair,
                apr: await calculateAPR(pair),
            })));
        });

        const pairs = (await Promise.all(pairsPromises)).flatMap((pair) => pair);

        const sortedPairs = pairs.sort((a, b) => b.apr - a.apr);

        callback({
            text: "Here are the top gainers for the Arbitrum blockchain:",
            content: {
                pairs: sortedPairs,
                topGainers: topGainersData
            },
        });

        return true;
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Show me the top gainers for the Arbitrum blockchain.",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll retrieve the top gainers for the Arbitrum blockchain.",
                    action: "GET_ARBITRUM_MARKET_OVERVIEW",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "What are the top gainers pools for the Arbitrum blockchain?",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll retrieve the top gainers pools for the Arbitrum blockchain.",
                    action: "GET_ARBITRUM_MARKET_OVERVIEW",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "What are the market top gainers pools?",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll retrieve the market top gainers pools for the Arbitrum blockchain.",
                    action: "GET_ARBITRUM_MARKET_OVERVIEW",
                },
            },
        ],
    ],
}
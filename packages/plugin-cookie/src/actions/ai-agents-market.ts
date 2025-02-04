import { Memory, State, Action, IAgentRuntime, composeContext, generateMessageResponse, ModelClass, parseJSONObjectFromText } from "@elizaos/core";
import { initCookieApi } from "../api/cookie-api";
import { aiAgentsAnalysisTemplate } from '../templates';
import { AiAgentData, MarketAnalyzeLLMResponse } from "../types";

export const aiAgentsMarketOverviewAction: Action = {
    name: "AI_AGENT_MARKET_OVERVIEW",
    description: "Get an overview of the AI agents on the market",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        _state: State,
        _options: any,
        callback
    ) => {
        const cookieApi = initCookieApi(runtime);
        const agents = await cookieApi.getAllAgents();

        if (!agents) {
            return null;
        }

        const analysis = await analyzeAgentOpportunities(runtime, agents, message);

        if (!analysis) {
            return null;
        }

        callback({
            text: analysis?.marketSentiment || "",
            action: "AI_AGENT_MARKET_OVERVIEW",
            stringifiedAnalysis: JSON.stringify(analysis),
            ...analysis,
        });

        return analysis;
    },
    validate: async (runtime: IAgentRuntime) => {
        const cookieApiKey = runtime.getSetting("COOKIE_API_KEY");
        return typeof cookieApiKey === "string";
    },
    examples: [
        [
            {
                user: "user",
                content: {
                    text: "What are the best AI agents on the market?",
                    action: "AI_AGENT_MARKET_OVERVIEW",
                },
            },
        ],
    ],
    similes: ["AI_AGENT_MARKET_OVERVIEW", "AI_AGENT_MARKET"],
};

export const analyzeAgentOpportunities = async (
    runtime: IAgentRuntime,
    agents: AiAgentData[],
    message: Memory
): Promise<MarketAnalyzeLLMResponse | null> => {
    const formattedAgentData = agents.map((agent) => ({
        name: agent.agentName,
        price: agent.price,
        liquidity: agent.liquidity,
        volume24h: agent.volume24Hours,
        holderCount: agent.holdersCount,
        topTweets: agent.topTweets,
        volume24HoursDeltaPercent: agent.volume24HoursDeltaPercent,
        holdersCountDeltaPercent: agent.holdersCountDeltaPercent,
        marketCap: agent.marketCap,
        marketCapDeltaPercent: agent.marketCapDeltaPercent,
        mindshare: agent.mindshare,
        mindshareDeltaPercent: agent.mindshareDeltaPercent,
    }));

    const state = await runtime.composeState(message, {
        agentsData: formattedAgentData,
    });

    const context = composeContext({
        state,
        template: aiAgentsAnalysisTemplate,
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

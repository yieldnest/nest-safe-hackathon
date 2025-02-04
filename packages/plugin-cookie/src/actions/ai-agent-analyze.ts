import { Memory, State, Action, IAgentRuntime, composeContext, generateMessageResponse, ModelClass, parseJSONObjectFromText, generateText } from "@elizaos/core";
import { initCookieApi } from "../api/cookie-api";
import { aiAgentIdentifierTemplate, aiAgentSingleAnalysisTemplate } from '../templates';
import { AiAgentData, SingleAgentAnalysisResponse } from "../types";

export const aiAgentAnalyzeAction: Action = {
    name: "AI_AGENT_ANALYZE",
    description: "Analyze a specific AI agent by name or address",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        _state: State,
        options: { identifier: string; type: 'name' | 'address' },
        callback
    ) => {
        const cookieApi = initCookieApi(runtime);
        let agent: AiAgentData | null = null;

        const state = await runtime.composeState(message);

        const nameOrAddress = await generateText({
            runtime,
            context: composeContext({
                state,
                template: aiAgentIdentifierTemplate,
            }),
            modelClass: ModelClass.LARGE,
        });

        if (nameOrAddress === "NOT_FOUND" || !nameOrAddress) {
            callback({
                text: "Could not find AI agent",
                action: "AI_AGENT_ANALYZE",
                success: false
            });
            return null;
        }

        agent = await cookieApi.getAgentDataByName(nameOrAddress);

        if (!agent) {
            agent = await cookieApi.getAgentDataByAddress(nameOrAddress);
        }

        if (!agent) {
            callback({
                text: `Could not find AI agent with ${options.type}: ${options.identifier}`,
                action: "AI_AGENT_ANALYZE",
                success: false
            });
            return null;
        }

        const analysis = await analyzeAgent(runtime, agent, message);

        if (!analysis) {
            callback({
                text: "Failed to analyze agent data",
                action: "AI_AGENT_ANALYZE",
                success: false
            });
            return null;
        }

        callback({
            text: analysis.conclusion.summary,
            action: "AI_AGENT_ANALYZE",
            stringifiedAnalysis: JSON.stringify(analysis),
            success: true,
            sentiment: analysis.investmentAnalysis.shortTermOutlook,
            recommendation: analysis.investmentAnalysis.recommendedAction,
            confidence: analysis.conclusion.confidenceLevel,
            riskLevel: analysis.riskAssessment.overallRisk,
            ...analysis
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
                    text: "Analyze AI agent @ElizaAI",
                    action: "AI_AGENT_ANALYZE",
                },
            },
        ],
        [
            {
                user: "user",
                content: {
                    text: "What about AI agent 0x1234...",
                    action: "AI_AGENT_ANALYZE",
                },
            },
        ],
    ],
    similes: ["AI_AGENT_ANALYZE", "ANALYZE_AGENT", "CHECK_AGENT"],
};

const analyzeAgent = async (
    runtime: IAgentRuntime,
    agent: AiAgentData,
    message: Memory
): Promise<SingleAgentAnalysisResponse | null> => {
    const formattedAgentData = {
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
        contractAddresses: agent.contracts.map(contract => contract.contractAddress),
        socialMetrics: {
            followersCount: agent.followersCount,
            smartFollowersCount: agent.smartFollowersCount,
            averageImpressionsCount: agent.averageImpressionsCount,
            averageEngagementsCount: agent.averageEngagementsCount,
            averageImpressionsCountDeltaPercent: agent.averageImpressionsCountDeltaPercent,
            averageEngagementsCountDeltaPercent: agent.averageEngagementsCountDeltaPercent,
        },
        tradingVolume: agent.volume24Hours
    };

    const state = await runtime.composeState(message, {
        agentsData: formattedAgentData
    });

    const context = composeContext({
        state,
        template: aiAgentSingleAnalysisTemplate,
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
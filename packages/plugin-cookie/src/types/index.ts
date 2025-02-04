export type AiAgentData = {
    agentName: string,
    contracts: ContractType[],
    twitterUsernames: string[],
    mindshare: number,
    mindshareDeltaPercent: number,
    marketCap: number,
    marketCapDeltaPercent: number,
    price: number,
    priceDeltaPercent: number,
    liquidity: number,
    volume24Hours: number,
    volume24HoursDeltaPercent: number,
    holdersCount: number,
    holdersCountDeltaPercent: number,
    averageImpressionsCount: number,
    averageImpressionsCountDeltaPercent: number,
    averageEngagementsCount: number,
    averageEngagementsCountDeltaPercent: number,
    followersCount: number,
    smartFollowersCount: number,
    topTweets: TwitterTopTweet[]
};

export type ContractType = {
    chain: number,
    contractAddress: string
}

export type TwitterTopTweet = {
    tweetUrl: string;
    tweetAuthorProfileImageUrl: string;
    tweetAuthorDisplayName: string;
    smartEngagementPoints: number;
    impressionsCount: number;
};

export type ApiResponse<Ok extends object, Err extends object = { message: string }> = {
    ok: Ok;
    error: null;
    success: true;
} | {
    ok: null;
    error: Err;
    success: false;
}

export type OneAgentResponse = ApiResponse<AiAgentData>
export type PaginatedAgentsResponse = ApiResponse<{
    data: AiAgentData[],
    currentPage: number,
    totalPages: number,
    totalCount: number
}>

export type MarketAnalyzeLLMResponse = {
    topOpportunities: {
        agentName: string,
        contractAddress: string,
        currentPrice: number,
        potentialRating: number,
        reasonsToInvest: string[],
        riskFactors: string[],
        recommendedAction: "buy" | "watch" | "avoid",
        entryPriceRange: {
            min: number,
            max: number
        },
        targetPriceRange: {
            min: number,
            max: number
        },
        timeframe: "short" | "medium" | "long",
        confidence: number
    }[]
    marketSentiment: "bullish" | "neutral" | "bearish",
    analysisTimestamp: string,
    additionalInsights: string[]
};

export type SingleAgentAnalysisResponse = {
    agentProfile: {
        name: string;
        contractAddress: string;
        currentPrice: number;
        marketCap: number;
        rank: number | null;
        category: string;
    };
    fundamentalAnalysis: {
        overallScore: number;
        communityStrength: number;
        productDevelopment: number;
        teamTransparency: number;
        uniqueValueProposition: string;
        competitiveAdvantages: string[];
        keyWeaknesses: string[];
    };
    technicalAnalysis: {
        trendStrength: number;
        volumeQuality: number;
        liquidityDepth: number;
        priceStability: number;
        keyLevels: {
            strongSupport: number;
            strongResistance: number;
            nextTargets: number[];
        };
    };
    riskAssessment: {
        overallRisk: 'low' | 'medium' | 'high';
        securityScore: number;
        liquidityRisk: number;
        concentrationRisk: number;
        volatilityRisk: number;
        keyRiskFactors: string[];
    };
    growthMetrics: {
        holder24hChange: number;
        volume24hChange: number;
        priceMovement: {
            '24h': number;
            '7d': number;
            '30d': number;
        };
        socialGrowth: {
            engagement: number;
            sentiment: 'positive' | 'neutral' | 'negative';
            trendingScore: number;
        };
    };
    investmentAnalysis: {
        shortTermOutlook: 'bullish' | 'neutral' | 'bearish';
        longTermPotential: number;
        recommendedAction: 'buy' | 'hold' | 'sell' | 'watch';
        entryPoints: {
            aggressive: number;
            conservative: number;
        };
        targetPrices: {
            shortTerm: number;
            midTerm: number;
            longTerm: number;
        };
        stopLoss: number;
    };
    keyInsights: {
        strengths: string[];
        opportunities: string[];
        threats: string[];
        catalysts: string[];
        redFlags: string[];
    };
    conclusion: {
        summary: string;
        confidenceLevel: number;
        timeHorizon: 'short' | 'medium' | 'long';
        riskRewardRatio: number;
    };
}

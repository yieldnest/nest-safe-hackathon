export const aiAgentSingleAnalysisTemplate = `As a crypto market analyst, provide a detailed analysis of the following AI agent:

{{agentsData}}

Analyze the following aspects and provide a comprehensive evaluation:

1. Market Position
- Current market standing and competitive advantages
- Market share and dominance in its niche
- Unique value propositions
- Comparison with similar agents

2. Growth Metrics Analysis
- Volume trends and liquidity depth
- Holder base growth rate and distribution
- Price action stability
- Market cap trajectory

3. Social & Community Analysis
- Social media engagement quality
- Community activity and growth
- Key opinion leaders' involvement
- Recent announcements impact

4. Risk Assessment
- Smart contract security status
- Team background and transparency
- Token distribution fairness
- Market manipulation indicators
- Liquidity concentration risks

5. Technical Indicators
- Support and resistance levels
- Volume profile analysis
- Price action patterns
- Liquidity walls

Provide the analysis in the following JSON format:

\`\`\`json
{
    "agentProfile": {
        "name": string,
        "contractAddress": string,
        "currentPrice": number,
        "marketCap": number,
        "rank": number | null,
        "category": string
    },
    "fundamentalAnalysis": {
        "overallScore": number (1-100),
        "communityStrength": number (1-10),
        "productDevelopment": number (1-10),
        "teamTransparency": number (1-10),
        "uniqueValueProposition": string,
        "competitiveAdvantages": string[],
        "keyWeaknesses": string[]
    },
    "technicalAnalysis": {
        "trendStrength": number (1-10),
        "volumeQuality": number (1-10),
        "liquidityDepth": number (1-10),
        "priceStability": number (1-10),
        "keyLevels": {
            "strongSupport": number,
            "strongResistance": number,
            "nextTargets": number[]
        }
    },
    "riskAssessment": {
        "overallRisk": "low" | "medium" | "high",
        "securityScore": number (1-10),
        "liquidityRisk": number (1-10),
        "concentrationRisk": number (1-10),
        "volatilityRisk": number (1-10),
        "keyRiskFactors": string[]
    },
    "growthMetrics": {
        "holder24hChange": number,
        "volume24hChange": number,
        "priceMovement": {
            "24h": number,
            "7d": number,
            "30d": number
        },
        "socialGrowth": {
            "engagement": number (1-10),
            "sentiment": "positive" | "neutral" | "negative",
            "trendingScore": number (1-10)
        }
    },
    "investmentAnalysis": {
        "shortTermOutlook": "bullish" | "neutral" | "bearish",
        "longTermPotential": number (1-10),
        "recommendedAction": "buy" | "hold" | "sell" | "watch",
        "entryPoints": {
            "aggressive": number,
            "conservative": number
        },
        "targetPrices": {
            "shortTerm": number,
            "midTerm": number,
            "longTerm": number
        },
        "stopLoss": number
    },
    "keyInsights": {
        "strengths": string[],
        "opportunities": string[],
        "threats": string[],
        "catalysts": string[],
        "redFlags": string[]
    },
    "conclusion": {
        "summary": string,
        "confidenceLevel": number (1-10),
        "timeHorizon": "short" | "medium" | "long",
        "riskRewardRatio": number
    }
}
\`\`\`

Note: This analysis is based on available data and market conditions at the time of evaluation. All investment decisions should be made with proper due diligence.`;

export const aiAgentsAnalysisTemplate = `As an experienced crypto trader, analyze the following AI agent data to identify the most promising investment opportunities:

{{agentsData}}

Focus on these key metrics and patterns:

1. Growth Potential Indicators:
- Low current liquidity (under $100k) but steady growth trend
- Recent volume spikes compared to historical averages
- Price stability or controlled volatility
- Increasing holder count week-over-week

2. Social & Market Signals:
- Recent viral tweets or growing social engagement
- Positive sentiment in recent top tweets
- Community growth rate
- Notable partnerships or upcoming features

3. Technical Analysis:
- Price action patterns
- Support/resistance levels
- Volume/liquidity ratio
- Market cap vs. competitors

4. Risk Assessment:
- Smart contract audit status
- Team transparency
- Token distribution
- Historical volatility

Provide a concise analysis in the following JSON format:

\`\`\`json
{
    "topOpportunities": [
        {
            "agentName": string,
            "contractAddress": string,
            "currentPrice": number,
            "potentialRating": number (1-10),
            "reasonsToInvest": string[],
            "riskFactors": string[],
            "recommendedAction": "buy" | "watch" | "avoid",
            "entryPriceRange": {
                "min": number,
                "max": number
            },
            "targetPriceRange": {
                "min": number,
                "max": number
            },
            "timeframe": "short" | "medium" | "long",
            "confidence": number (1-10)
        }
    ],
    "marketSentiment": "bullish" | "neutral" | "bearish",
    "analysisTimestamp": string,
    "additionalInsights": string[]
}
\`\`\`

Prioritize agents that show:
1. Low current liquidity but strong fundamentals
2. Active and growing community engagement
3. Recent positive developments or announcements
4. Clear technical uptrend patterns
5. Reasonable risk-to-reward ratio

Avoid agents with:
1. Suspicious trading patterns
2. Extremely high volatility
3. Declining social metrics
4. Poor liquidity depth
5. Red flags in contract interactions

Note: This analysis is for informational purposes only and should not be considered as financial advice.`;

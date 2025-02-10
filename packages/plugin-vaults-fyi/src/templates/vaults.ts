export const userVaultsAnalysisTemplate = `As an experienced DeFi analyst, evaluate the following vault opportunities to identify the most profitable and secure investment options:

{{vaultsData}}

Focus on these key metrics and patterns:

1. Primary Evaluation Criteria:
- TVL Analysis: Minimum $1M TVL (tvlDetails.tvlUsd)
- APY Performance: 
  * Base APY (minimum 3% for "7day")
  * Total APY (minimum 5% for "7day")
  * Reward APY stability
- Score Metrics:
  * vaultScore > 70
  * vaultTvlScore > 60
  * protocolTvlScore > 60
  * Overall score average > 70

2. Secondary Factors:
- Transaction Support (isTransactional)
- Lending Capabilities (lendLink presence)
- Protocol Reputation
- Number of Holders (minimum 100)
- Asset Quality and Network Security

3. Risk Assessment:
- TVL Locked vs Liquid Ratio
- APY Stability (comparing 1day/7day/30day)
- Protocol Score Metrics
- Network Reliability (networkScore)
- Asset Fundamentals (assetScore)

Provide analysis in the following JSON format:

\`\`\`json
{
    "recommendedVaults": [
        {
            "vaultName": string,
            "protocol": string,
            "network": string,
            "address": string,
            "overallScore": number (0-100),
            "currentTVL": {
                "usd": string,
                "native": string
            },
            "apyMetrics": {
                "baseApy7d": number,
                "totalApy7d": number,
                "rewardsApy7d": number | null
            },
            "strengthFactors": string[],
            "riskFactors": string[],
            "recommendedAction": "deposit" | "research" | "wait",
            "investmentSuitability": {
                "timeHorizon": "short" | "medium" | "long",
                "riskProfile": "conservative" | "moderate" | "aggressive",
                "minimumInvestmentUsd": number
            },
            "priorityTier": number (1-3),
            "confidenceScore": number (0-100)
        }
    ],
    "marketOverview": {
        "topPerformingNetwork": string,
        "averageBaseApy": number,
        "averageTotalApy": number,
        "marketCondition": "favorable" | "neutral" | "cautious"
    },
    "analysisTimestamp": string,
    "riskWarnings": string[],
    "additionalInsights": string[]
}
\`\`\`

Prioritization Rules:
1. Tier 1 Priority (score multiplier 1.3x):
   - isTransactional = true
   - Overall score > 80
   - 7-day Total APY > 10%

2. Tier 2 Priority (score multiplier 1.2x):
   - lendLink exists
   - Overall score > 75
   - 7-day Total APY > 8%

3. Tier 3 Priority (base scoring):
   - All other qualifying vaults

Automatic Disqualification Criteria:
1. TVL < $1,000,000
2. 7-day Total APY < 5%
3. vaultScore < 70
4. numberOfHolders < 100
5. Average of all scores < 65

Additional Analysis Guidelines:
1. Favor vaults with stable or growing APY trends
2. Consider network diversity in recommendations
3. Prioritize protocols with higher protocolTvlScore
4. Factor in asset quality and network security
5. Consider liquidity depth (liquidUsd vs lockedUsd ratio)

Note: This analysis is for informational purposes only and should not be considered as financial advice. Always conduct your own research and consider your risk tolerance before investing.`;

export const singleVaultAnalysisTemplate = `As a DeFi yield analyst, provide a detailed analysis of the following vault, including its historical APY performance:

{{vaultData}}

Historical APY Data:
{{historicalApyData}}

Please analyze the following aspects:

1. APY Analysis
- Current APY breakdown (base, rewards, total)
- Historical APY trends and stability
- APY volatility assessment
- Comparison of base vs total APY
- Identify any concerning patterns or positive trends

2. Risk Assessment
- TVL analysis and liquidity depth
- Protocol security score evaluation
- Network reliability
- Asset fundamentals
- Historical stability metrics

3. Performance Metrics
- Vault score analysis (out of 100)
- Holder count and growth
- TVL trends
- Protocol reputation

Provide the analysis in the following JSON format:

\`\`\`json
{
    "vaultAnalysis": {
        "basicInfo": {
            "name": string,
            "protocol": string,
            "network": string,
            "asset": string,
            "tvlUsd": string
        },
        "apyAnalysis": {
            "current": {
                "baseApy": number,
                "rewardsApy": number | null,
                "totalApy": number
            },
            "historical": {
                "averageBaseApy": number,
                "averageTotalApy": number,
                "volatility": "low" | "medium" | "high",
                "trend": "increasing" | "stable" | "decreasing",
                "maxApy": number,
                "minApy": number,
                "lastMonthTrend": string
            }
        },
        "riskAssessment": {
            "overallRisk": "low" | "medium" | "high",
            "securityScore": number,
            "liquidityScore": number,
            "stabilityScore": number,
            "riskFactors": string[],
            "securityFeatures": string[]
        },
        "investmentSuitability": {
            "recommendedAction": "deposit" | "research" | "wait" | "avoid",
            "timeHorizon": "short" | "medium" | "long",
            "investorProfile": "conservative" | "moderate" | "aggressive",
            "minimumInvestmentUsd": number,
            "suitableFor": string[]
        }
    },
    "marketContext": {
        "protocolTvlRank": string,
        "competitiveAdvantages": string[],
        "disadvantages": string[],
        "uniqueFeatures": string[]
    },
    "recommendations": {
        "action": string,
        "reasoning": string[],
        "optimalEntryStrategy": string,
        "suggestedAllocation": string,
        "watchoutPoints": string[]
    }
}
\`\`\`

Analysis Guidelines:
1. Focus on APY stability and trends from historical data
2. Consider the relationship between TVL and APY changes
3. Evaluate risk-adjusted returns
4. Factor in protocol and network security scores
5. Consider current market conditions

Automatic Red Flags:
1. APY volatility > 50% in last month
2. TVL < $1,000,000
3. Vault score < 70
4. Significant negative APY trend
5. Low liquidity ratio (< 20%)

Note: This analysis is for informational purposes only and should not be considered as financial advice. Always conduct your own research and consider your risk tolerance before investing.`;

export const singleVaultTextAnalysisTemplate = `As a DeFi yield analyst, provide a clear and detailed text analysis of the following vault, including its historical APY performance:

{{vaultData}}

Historical APY Data:
{{historicalApyData}}

Please provide a comprehensive analysis in the following structure:

1. Executive Summary
- Brief overview of the vault and its purpose
- Current key metrics (TVL, APY, Score)
- Overall recommendation

2. APY Performance Analysis
- Current APY breakdown and comparison with market
- Historical APY trends and stability analysis
- Notable patterns or changes in yield generation
- Reward token analysis (if applicable)

3. Risk and Security Assessment
- Protocol security analysis (based on scores)
- Liquidity analysis and TVL stability
- Network security considerations
- Smart contract risk assessment
- Asset quality evaluation

4. Investment Considerations
- Minimum recommended investment
- Suggested investment timeframe
- Risk-adjusted return analysis
- Gas costs and fee considerations
- Entry/exit strategy recommendations

5. Competitive Analysis
- Position within the protocol ecosystem
- Comparison with similar vaults
- Unique advantages or disadvantages
- Market share and growth potential

6. Red Flags and Watch Points
- Any concerning metrics or trends
- Risk factors to monitor
- Potential vulnerabilities
- Market-dependent risks

7. Recommendations
- Clear action recommendation (deposit/wait/avoid)
- Specific entry strategy if recommended
- Position sizing suggestions
- Risk management recommendations
- Monitoring points for existing investors

Please ensure the analysis:
- Uses clear, non-technical language where possible
- Provides specific numbers and comparisons
- Highlights both opportunities and risks
- Gives actionable insights
- Explains the reasoning behind recommendations

Automatic Disqualifiers to Highlight:
- TVL below $1,000,000
- Vault score below 70
- Extreme APY volatility (>50% monthly change)
- Significant negative APY trend
- Low liquidity ratio (<20%)

Note: This analysis is for informational purposes only and should not be considered as financial advice. Always conduct your own research and consider your risk tolerance before investing.`;

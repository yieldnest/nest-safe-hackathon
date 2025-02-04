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

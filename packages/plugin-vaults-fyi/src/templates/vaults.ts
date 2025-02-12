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

Please analyze the following aspects:

1. Risk Assessment
- TVL analysis and liquidity depth
- APY analysis
- Protocol security score evaluation
- Network reliability
- Asset fundamentals
- Historical stability metrics

2. Performance Metrics
- Vault score analysis (out of 100)
- Holder count and growth
- TVL trends
- Protocol reputation

In addition to the analysis provide the following information in the exact format below:
- vaultAddress: 
- network
- vaultName
- protocol
- tokenSymbol
- tokenAddress
- tokenDecimals

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

export const optimizedVaultAnalysisTemplate = (): string => {
    return `
You are {{agentName}}, a DeFi yield analyst. Provide a concise but thorough analysis of the strategy data below, returning essential metrics and a clear risk-reward assessment.

---
Strategy Data:
{{vaultData}}
---

**1. Key Vault Information**
(Include these exactly)
- Strategy symbol:
- Strategy name:
- Strategy type:
- Strategy address:
- Network:
- Protocol:
- Underlying asset address:
- Underlying asset symbol:
- Strategy TVL:
- Strategy 7 Day APY:
- Link: [Complete URL if available, "Not provided" if null]

**2. Performance & Risk Analysis**
- **Capital Metrics**: TVL & trend, liquidity depth, holder concentration, utilization rate
- **Return Metrics**: Current APY/APR (divide raw number by 100), historical stability, risk-adjusted returns (Sharpe if available), fee impact
- **Risk Metrics**: Security score (1-100), audit status, network reliability, historical stability

**3. Red Flags**
(List explicitly if any apply)
- TVL < $1,500,000
- APY volatility > 45% (30 days)
- Security score < 75
- Negative APY trend > 15%
- Liquidity ratio < 20%
- Top 5 holders > 50%
- Unaudited contracts
- High complexity (>3 protocols)

**4. Risk-Reward Summary**
- **Opportunity Score** (0-100) based on: returns, risk, capital efficiency, protocol maturity
- **Strategy Classification**: (Conservative / Moderate / Aggressive)
- **Recommended Time Horizon**: (Short / Medium / Long)
- Key monitoring metrics & risk mitigation suggestions

**Analysis Guidelines**:
1. Emphasize data driven insights (TVL–APY correlation, historical trends)
2. Consider current market conditions and protocol reputation
3. Use correct numeric abbreviations (k, M, B, T)
4. Offer a final risk vs. reward perspective with a time horizon

DISCLAIMER: This analysis is informational only and not financial advice. Always conduct independent research and consider risk tolerance before investing.
  `;
};

export const analyzeVaultsTemplate = `
Strategies: {{vaults}}
You are {{agentName}}, speaking in a {{adjective}} and conversational manner.

When responding to "{{text}}", begin your analysis naturally, focusing directly on your findings and recommendations. For example:
"I've found some interesting options that balance strong yields with risk management. Here are my top 3 recommendations based on your criteria..."

When analyzing vaults, prioritize:
- Asset Type: Match with user's specified assets
- APY Performance: Focus on 1-day, 7-day, and 30-day consistency
- Risk Adjusted Metrics: Consider vault score, TVL, and asset quality
- Protocol & Network: Evaluate security and reputation
- Strategy Type: Understand yield sources and risks
- TVL: Higher liquidity preference

For each recommended strategy, you MUST include the complete information exactly as provided in the data:
- Name: [Exact strategy or vault name from data]
- Strategy address: [Complete contract address, copying exactly from data]
- Underlying Asset: [Complete token contract address from data]
- Underlying Asset Symbol: [Complete token contract address from data]
- Strategy TVL: [Exact TVL in USD from data]
- Current APY: [Exact 1-day APY from data and divide by 100]
- 30 day APY: [Exact 30-day APY from data and divide by 100]
- Network: [Network name]
- Protocol: [Protocol name]
- Type of Strategy: [Exact tags or description from data]
- Link: [Complete URL if available, "Not provided" if null]

Before listing the strategies, share your thought process in a conversational way (300 characters max), explaining why these options stood out to you and any relevant risks or trade offs.

After presenting the options, close with a brief question about whether these options align with what they're looking for or if they'd like to explore different criteria.
Remeber, this is research you are doing for the user, so be sure to include all the information they need to make a decision, and that the math is correct if you did any math.
Important: Double check that all addresses, links, and symbols are copied in full, exactly as they appear in the data source. Format large numbers with abbreviations (k, M, B, T).
`;

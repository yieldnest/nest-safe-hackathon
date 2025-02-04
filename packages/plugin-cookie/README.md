# `@elizaos/plugin-cookie`

This plugin provides functionality to interact with the Cookie.fun API for analyzing AI agents in the crypto market. It offers comprehensive market analysis, individual agent assessment, and real-time market data tracking.

## Features

- Market Overview Analysis
- Individual Agent Analysis
- Smart Agent Identification
- Real-time Data Tracking
- Caching Support

## Configuration

### Required Setup

1. Get your Cookie API key from [Cookie.fun](https://cookie.fun)
2. Add it to your `.env` file:

```env
COOKIE_API_KEY=your-api-key-here
```

## Actions

### 1. AI Agent Market Overview

Analyzes all AI agents in the market to identify the most promising investment opportunities.

**Example usage:**
```bash
What are the best AI agents on the market?
Show me the top AI agent opportunities
```

**Response includes:**
- Top investment opportunities
- Market sentiment
- Risk analysis
- Entry/exit points
- Additional market insights

### 2. Single Agent Analysis

Provides detailed analysis of a specific AI agent by name or address.

**Example usage:**
```bash
Analyze AI agent @ElizaAI
Check the stats for 0x1234...
What do you think about Friend.tech?
```

**Analysis includes:**
- Market position
- Growth metrics
- Social & community analysis
- Risk assessment
- Technical indicators
- Investment recommendations

## Response Types

### Market Analysis Response

```typescript
{
    topOpportunities: [{
        agentName: string,
        currentPrice: number,
        potentialRating: number,
        reasonsToInvest: string[],
        recommendedAction: "buy" | "watch" | "avoid",
        // ... other metrics
    }],
    marketSentiment: "bullish" | "neutral" | "bearish",
    analysisTimestamp: string,
    additionalInsights: string[]
}
```

### Single Agent Analysis Response

```typescript
{
    agentProfile: {
        name: string,
        currentPrice: number,
        marketCap: number,
        // ... other profile data
    },
    fundamentalAnalysis: {
        overallScore: number,
        communityStrength: number,
        // ... other metrics
    },
    technicalAnalysis: {
        trendStrength: number,
        volumeQuality: number,
        // ... other indicators
    },
    // ... other analysis sections
}
```

## Caching

The plugin implements automatic caching for API responses:
- Market data: 30 minutes
- Individual agent data: 30 minutes
- Cached data is stored using the runtime's cache manager

## Error Handling

The plugin includes comprehensive error handling:
- API connection issues
- Invalid agent identifiers
- Rate limiting
- Data parsing errors

### Usage in Your Project

```typescript
import { cookiePlugin } from "@elizaos/plugin-cookie";

// Add to your Eliza OS configuration
const config = {
    plugins: [
        cookiePlugin,
        // ... other plugins
    ]
};
```

## License

MIT

## Support

For support, please refer to:
- [Cookie.fun Documentation](https://cookie.fun/docs)

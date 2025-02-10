export const getPairOHLCVTemplateArbitrum = `Given the most recent message only, extract information needed to fetch OHLCV (price history) data for a Arbitrum trading pair. This is specifically for Arbitrum blockchain only.

Extract these fields:
- pairAddress: the Arbitrum pair address (a hex string)
- timeframe: the candle timeframe (default to "1h" if not specified)
- currency: the price currency (default to "usd" if not specified)
- fromDate: start date in YYYY-MM-DD format (if not specified or if message says "past X days", calculate from current date ${new Date().toISOString().split("T")[0]})
- toDate: end date in YYYY-MM-DD format (if not specified, use current date ${new Date().toISOString().split("T")[0]})
- limit: number of candles to return (calculate based on timeframe and date range)
- displayCandles: number of candles to display in response (default to 5 if not specified, max 100)

Example responses:
For "Get hourly candlesticks for past 2 days for Arbitrum pair 0x1f98431c8ad98523631ae4a59f267346ea31f984":
\`\`\`json
{
  "pairAddress": "0x1f98431c8ad98523631ae4a59f267346ea31f984",
  "timeframe": "1h",
  "currency": "usd",
  "fromDate": "2025-01-20",
  "toDate": "2025-01-22",
  "limit": 48,
  "displayCandles": 5
}
\`\`\`

For "Show me last 20 candles of 15-minute price history for Arbitrum pair 0x1f98431c8ad98523631ae4a59f267346ea31f984":
\`\`\`json
{
  "pairAddress": "0x1f98431c8ad98523631ae4a59f267346ea31f984",
  "timeframe": "15m",
  "currency": "usd",
  "fromDate": "2025-01-20",
  "toDate": "2025-01-22",
  "limit": 192,
  "displayCandles": 20
}
\`\`\`

{{recentMessages}}
Extract the OHLCV request parameters from the LAST message only and respond with a SINGLE JSON object. If a specific number of candles is requested, include it in displayCandles (max 100). If not specified, set displayCandles to 5. If the message is asking for pairs on other chains (like Solana), return null for pairAddress.`;

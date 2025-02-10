export const SOLANA_API_BASE_URL = "https://solana-gateway.moralis.io";

export const API_ENDPOINTS = {
    SOLANA: {
        TOKEN_PAIRS: (tokenAddress: string) =>
            `/token/mainnet/${tokenAddress}/pairs`,
        PAIR_STATS: (pairAddress: string) =>
            `/token/mainnet/pairs/${pairAddress}/stats`,
        PAIR_OHLCV: (pairAddress: string) =>
            `/token/mainnet/pairs/${pairAddress}/ohlcv`,
        TOKEN_STATS: (tokenAddress: string) =>
            `/token/mainnet/${tokenAddress}/pairs/stats`,
        TOKEN_PRICE: (tokenAddress: string) =>
            `/token/mainnet/${tokenAddress}/price`,
        TOKEN_METADATA: (tokenAddress: string) =>
            `/token/mainnet/${tokenAddress}/metadata`,
    },
    ARBITRUM: {
        MARKET_GAINERS: `https://deep-index.moralis.io/api/v2.2/discovery/tokens/top-gainers?chain=arbitrum&min_market_cap=50000000&security_score=80&time_frame=1d`,
        PAIRS_FOR_TOKEN: (tokenAddress: string) =>
            `https://deep-index.moralis.io/api/v2.2/erc20/${tokenAddress}/pairs?chain=arbitrum`,
        SEARCH_PROTOCOL: (protocolName: string) =>
            `https://deep-index.moralis.io/api/v2.2/entities/search?query=${protocolName}`,
    },
} as const;

export const PANCAKE_SWAP_API_ARBITRUM_APR_URL = "https://explorer.pancakeswap.com/api/cached/pools/apr/v3/arbitrum/";
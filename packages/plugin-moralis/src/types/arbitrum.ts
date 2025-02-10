type TimeFrameChanges = {
  "1h": number | null;
  "1d": number | null;
  "1w": number | null;
  "1M": number | null;
};

export type TopGainer = {
  // Basic Token Info
  chain_id: "0xa4b1"; // arbitrum
  token_address: string;
  token_logo: string;
  token_name: string;
  token_symbol: string;
  
  // Market Metrics
  price_usd: number;
  market_cap: number;
  fully_diluted_valuation: number;
  
  // Token Metrics
  token_age_in_days: number;
  on_chain_strength_index: number;
  security_score: number;
  twitter_followers: number | null;
  
  // Time-based Changes
  holders_change: TimeFrameChanges;
  liquidity_change_usd: TimeFrameChanges;
  experienced_net_buyers_change: TimeFrameChanges;
  volume_change_usd: TimeFrameChanges;
  net_volume_change_usd: TimeFrameChanges;
  price_percent_change_usd: TimeFrameChanges;
};

// Optional: Add some utility types for specific use cases
export type TokenIdentifier = Pick<TopGainer, 'token_address' | 'token_name' | 'token_symbol'>;
export type MarketMetrics = Pick<TopGainer, 'price_usd' | 'market_cap' | 'fully_diluted_valuation'>;
export type SecurityMetrics = Pick<TopGainer, 'security_score' | 'on_chain_strength_index'>;

type PairToken = {
  token_address: string;
  token_name: string;
  token_symbol: string;
  token_logo: string;
  token_decimals: string;
  pair_token_type: 'token0' | 'token1';
  liquidity_usd: number;
};

export type DexPair = {
  exchange_address: string;
  exchange_name: string;
  exchange_logo: string;
  pair_label: string;
  pair_address: string;
  
  // Price Information
  usd_price: number;
  usd_price_24hr_percent_change: number;
  usd_price_24hr_usd_change: number;
  
  // Liquidity & Volume
  liquidity_usd: number;
  volume_24h_native: number;
  volume_24h_usd: number;
  
  // Pair Status
  inactive_pair: boolean;
  
  // Token Information
  base_token: string;
  quote_token: string;
  pair: [PairToken, PairToken];
};

export type PairsForTokenPaginated = {
  page_size: number;
  page: number;
  pairs: DexPair[];
}; 

export type SearchProtocolContent = {
  protocolName: string;
};

export type ProtocolData = {
  name: string;
  id: string;
  logo: string;
  bio: string;
  description: string | null;
  website: string;
  twitter: string;
  type: string;
};

export type ProtocolAddress = {
  address: string;
  chain: string;
  is_multi_chain: boolean;
  primary_label: string;
  entity: {
    name: string | null;
    id: string | null;
  };
};

export type SearchQueryResult = {
  page: number;
  page_size: number;
  result: {
    entities: ProtocolData[];
    addresses: ProtocolAddress[];
  }
};

export type TokenMetadata = {
  address: string;
  address_label: string | null;
  name: string;
  symbol: string;
  decimals: string;
  logo: string;
  logo_hash: string | null;
  thumbnail: string;
  total_supply: string;
  total_supply_formatted: string;
  fully_diluted_valuation: string;
  block_number: string;
  validated: number;
  created_at: string;
  possible_spam: boolean;
  verified_contract: boolean;
  categories: string[];
  links: {
    reddit: string;
    twitter: string;
    website: string;
    moralis: string;
  };
  security_score: number;
  description: string | null;
  circulating_supply: string;
  market_cap: string;
}

export interface TokenMetadataContent {
  tokenAddress: string;
}
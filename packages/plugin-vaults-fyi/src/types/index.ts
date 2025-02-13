import { chains } from "../constants/chains";

export type Chains = (typeof chains)[number]["name"];

export type UserAsset = {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    network: Chains;
    balance: string;
    balanceNative: string;
    balanceUsd: string;
    type: string;
};
export type UserAssets = Record<Chains, UserAsset[]>;

export type VaultDetailed = {
    name: string;
    address: string;
    network: Chains;
    protocol: string;
    tvlDetails: {
        tvlNative: string;
        tvlUsd: string;
        lockedNative: string;
        lockedUsd: string;
        liquidNative: string;
        liquidUsd: string;
    };
    numberOfHolders: number;
    lendLink: string | null;
    tags: string[];
    token: {
        name: string;
        assetAddress: string;
        assetCaip: string;
        symbol: string;
        decimals: number;
    };
    apy: {
        base: {
            "1day": number;
            "7day": number;
            "30day": number;
        };
        rewards?: {
            "1day": number;
            "7day": number;
            "30day": number;
        };
        total: {
            "1day": number;
            "7day": number;
            "30day": number;
        };
    };
    description: string;
    rewards: {
        apy: {
            "1day": number;
            "7day": number;
            "30day": number;
        };
        assetPriceInUsd: number;
        asset: {
            name: string;
            assetAddress: string;
            assetCaip: string;
            symbol: string;
            decimals: number;
        };
    };
    isTransactional: boolean;
    score: {
        vaultScore: number;
        vaultTvlScore: number;
        protocolTvlScore: number;
        holderScore: number;
        networkScore: number;
        assetScore: number;
    };
};

export type VaultsDetailedPaginatedResponse = {
    data: VaultDetailed[];
    next_page?: number;
};

export type VaultDepositTx = {
    currentActionIndex: number;
    actions: Array<{
        name: string;
        tx: {
            to: string;
            chainId: number;
            data: string;
            value: string;
        };
        simulation: {
            url: string;
            status: string;
            tokensReceived: {
                [key: string]: string;
            };
            tokensSpent: {
                [key: string]: string;
            };
        };
    }>;
};

export type UserVaultsAnalyzeLLMResponse = {
    recommendedVaults: Array<{
        vaultName: string;
        protocol: string;
        network: string;
        address: string;
        overallScore: number;
        currentTVL: {
            usd: string;
            native: string;
        };
        apyMetrics: {
            baseApy7d: number;
            totalApy7d: number;
            rewardsApy7d: number | null;
        };
        strengthFactors: string[];
        riskFactors: string[];
        recommendedAction: "deposit" | "research" | "wait";
        investmentSuitability: {
            timeHorizon: "short" | "medium" | "long";
            riskProfile: "conservative" | "moderate" | "aggressive";
            minimumInvestmentUsd: number;
        };
        priorityTier: number;
        confidenceScore: number;
    }>;
    marketOverview: {
        topPerformingNetwork: string;
        averageBaseApy: number;
        averageTotalApy: number;
        marketCondition: "favorable" | "neutral" | "cautious";
    };
    analysisTimestamp: string;
    riskWarnings: string[];
    additionalInsights: string[];
};

export type HistoricalData = {
    timestamp: number;
    blockNumber: number;
    apy: {
        base: number;
        rewards: number;
        total: number;
    };
    tvlDetails: {
        tvlNative: string;
        tvlUsd: string;
        lockedNative: string;
        lockedUsd: string;
        liquidNative: string;
        liquidUsd: string;
    };
};

export type HistoricalApyResponse = {
    next_page?: number;
    data: HistoricalData[];
};

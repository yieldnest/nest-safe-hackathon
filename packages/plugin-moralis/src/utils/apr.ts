import { DexPair } from "../types/arbitrum";
import { PANCAKE_SWAP_API_ARBITRUM_APR_URL } from "./constants";
import { arbitrum } from "viem/chains";
import { createPublicClient, http } from "viem";

export const aprFetcherPancakeSwap = async (pair: DexPair) => {
    try {
        const response = await fetch(`${PANCAKE_SWAP_API_ARBITRUM_APR_URL}${pair.pair_address}`);
        const data = await response.json();
        return parseFloat(data.apr7d) * 100;
    } catch {
        return 0;
    }
};

const BIPS_BASE = 10_000;

// Referenced from https://github.com/Uniswap/interface/blob/main/apps/web/src/graphql/data/pools/useTopPools.ts#L39-L51
export const calculateAPR = async (pair: DexPair, chain = arbitrum) => {
    const client = createPublicClient({
        chain,
        transport: http(),
    });

    let fee = BIPS_BASE;

    try {
        const feeTier = await client.readContract({
            address: pair.pair_address as `0x${string}`,
            abi: [{"inputs":[],"name":"fee","outputs":[{"internalType":"uint24","name":"","type":"uint24"}],"stateMutability":"view","type":"function"}] as const,
            functionName: "fee",
        });

        fee = Number(feeTier);
    } catch {
        // mute error
    }

    // referenced from https://github.com/Uniswap/sdk-core/blob/main/src/entities/fractions/percent.ts#L42
    return (Math.round(pair.volume_24h_usd * (fee / (BIPS_BASE * 100)) * 365) / Math.round(pair.liquidity_usd)) * 100 * 1_000;
}

export const aprFetcher = async (pair: DexPair) => {
    const pancakeSwapAPR = await aprFetcherPancakeSwap(pair);
    if (pancakeSwapAPR > 0) {
        return pancakeSwapAPR;
    }
    const uniswapV3APR = await calculateAPR(pair);
    return uniswapV3APR;
};

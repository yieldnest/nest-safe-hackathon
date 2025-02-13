import { useQuery } from "@tanstack/react-query";
import { useSafeDetails } from "./use-safe-details";

type SafeToken = {
    balance: string;
    balance_formatted: string;
    decimals: number;
    logo: string;
    name: string;
    native_token: boolean;
    percentage_relative_to_total_supply: number | null;
    portfolio_percentage: number | null;
    possible_spam: boolean;
    security_score: number;
    symbol: string;
    thumbnail: string;
    token_address: string;
    total_supply: number | null;
    total_supply_formatted: number | null;
    usd_price: number;
    usd_price_24hr_percent_change: number;
    usd_price_24hr_usd_change: number;
    usd_value: number;
    usd_value_24hr_usd_change: number;
    verified_contract: boolean;
}

export const useSafeTokens = () => {
    const { safeDetails } = useSafeDetails();

    const { data, isLoading } = useQuery<SafeToken[]>({
        queryKey: ['safe-tokens', safeDetails?.address],
        queryFn: async () => {
            const data = await fetch(`/api/balance/${safeDetails?.address}/tokens?chain=arbitrum&exclude_spam=true`)
            const json = await data.json();
            return json.result;
        },
    });

    return { data: data || [], isLoading };
};
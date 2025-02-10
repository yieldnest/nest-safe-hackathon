import { elizaLogger, IAgentRuntime } from "@elizaos/core";
import {
    Chains,
    HistoricalApy,
    HistoricalApyResponse,
    UserAsset,
    UserAssets,
    VaultDepositTx,
    VaultDetailed,
    VaultsDetailedPaginatedResponse,
} from "../types";

class VaultsFyiApi {
    private readonly apiKey: string;
    private readonly runtime: IAgentRuntime;

    constructor(apiKey: string, runtime: IAgentRuntime) {
        this.apiKey = apiKey;
        this.runtime = runtime;
    }

    private get headers(): Record<string, string> {
        return {
            "Content-Type": "application/json",
            "x-api-key": this.apiKey,
        };
    }

    public async getUserAssets(address: string): Promise<UserAssets | null> {
        const cacheKey = `vaults-fyi/client/user_assets_${address}`;
        const cachedData = await this.runtime.cacheManager.get(cacheKey);
        if (cachedData) {
            return cachedData as UserAssets;
        }
        const data = await this.request<UserAssets>(
            `/transactions/wallet-balances`,
            { account: address }
        );
        if (!data) {
            return null;
        }
        await this.runtime.cacheManager.set(cacheKey, data, {
            expires: 60 * 60 * 0.5,
        }); // 30 minutes
        return data;
    }

    public async getChainUserAssets(
        chain: Chains,
        address: string
    ): Promise<UserAsset[] | null> {
        const data = await this.getUserAssets(address);
        if (!data) {
            return null;
        }
        return data[chain];
    }

    // per_page = 100 is the maximum
    public async getVaultsDetailed(
        page: number,
        pageSize: number = 50
    ): Promise<VaultsDetailedPaginatedResponse | null> {
        const data = await this.request<VaultsDetailedPaginatedResponse>(
            `/detailed/vaults`,
            {
                page: page,
                per_page: pageSize,
                network: "arbitrum",
                tvl_min: 1000000,
            }
        );
        return data;
    }

    public async getAllVaults(
        network: Chains = "arbitrum"
    ): Promise<VaultDetailed[]> {
        const cacheKey = `vaults-fyi/client/all_vaults_${network}`;
        const cachedData = await this.runtime.cacheManager.get(cacheKey);
        if (cachedData) {
            return cachedData as VaultDetailed[];
        }
        const pageSize = 100;
        let page = 0;
        let allVaults: VaultDetailed[] = [];
        while (true) {
            const data = await this.getVaultsDetailed(page, pageSize);
            if (!data) {
                break;
            }
            allVaults = [...allVaults, ...data.data];
            if (!data.next_page) {
                break;
            }
            page++;
        }
        await this.runtime.cacheManager.set(cacheKey, allVaults, {
            expires: 60 * 60 * 12,
        }); // 12 hours
        return allVaults;
    }

    public async getVaultsForUser(address: string): Promise<VaultDetailed[]> {
        const allVaults = await this.getAllVaults();
        const userAssets = await this.getUserAssets(address);
        const userVaults = allVaults.filter((vault) => {
            const userAsset = userAssets?.[vault.network]?.find(
                (asset) => asset.address === vault.token.assetAddress
            );
            return userAsset && parseFloat(userAsset.balanceUsd) > 0;
        });
        return userVaults;
    }

    public async getVault(vaultAddress: string): Promise<VaultDetailed | null> {
        const allVaults = await this.getAllVaults();
        return (
            allVaults.find((vault) => vault.address === vaultAddress) || null
        );
    }

    public async getVaultDepositTx(
        vaultAddress: string,
        senderAddress: string,
        amount: string
    ): Promise<VaultDepositTx | null> {
        const vault = await this.getVault(vaultAddress);
        if (!vault || !vault.isTransactional) {
            return null;
        }
        const data = await this.request<VaultDepositTx>(
            `/transactions/vaults/deposit`,
            {
                network: vault.network,
                sender: senderAddress,
                simulate: true,
                assetAddress: vault.token.assetAddress,
                vaultAddress,
                amount,
            }
        );
        return data;
    }

    public async getHistoricalApy({
        vaultAddress,
        network = "arbitrum",
        interval = "7day",
        granularity = 86400,
        from_timestamp = Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60,
        to_timestamp = Math.floor(Date.now() / 1000),
    }: {
        vaultAddress: string;
        network: Chains;
        interval?: "1day" | "7day" | "30day";
        from_timestamp?: number;
        to_timestamp?: number;
        granularity?: number;
    }): Promise<HistoricalApy[] | null> {
        let page = 0;
        let allData: HistoricalApy[] = [];
        while (true) {
            const data = await this.request<HistoricalApyResponse>(
                `/vaults/${network}/${vaultAddress}/historical-apy`,
                { interval, granularity, from_timestamp, to_timestamp, page }
            );
            if (!data) {
                break;
            }
            allData = [...allData, ...data.data];
            if (!data.next_page) {
                break;
            }
            page++;
        }
        return allData;
    }

    private async request<T>(
        url: string,
        queryParams?: object,
        method: "GET" | "POST" = "GET"
    ): Promise<T> {
        const queryString = Object.entries(queryParams || {})
            .map(([key, value]) => `${key}=${value}`)
            .join("&");
        try {
            const response = await fetch(
                `https://api.vaults.fyi/v1${url}?${queryString}`,
                {
                    method: method,
                    headers: this.headers,
                }
            );

            if (!response.ok) {
                elizaLogger.error(
                    `API request failed: ${response.status} ${response.statusText}`
                );
                return null;
            }

            const data = await response.json();
            if (data.error) {
                elizaLogger.error(`API error: ${data.message}`);
                return null;
            }

            return data;
        } catch (error) {
            elizaLogger.error(`Request failed: ${error}`);
            return null;
        }
    }
}

export const initVaultsFyiApi = (runtime: IAgentRuntime) => {
    const apiKey = runtime.getSetting("VAULTS_FYI_API_KEY");
    if (!apiKey) {
        throw new Error("VAULTS_FYI_API_KEY is missing");
    }

    return new VaultsFyiApi(apiKey, runtime);
};

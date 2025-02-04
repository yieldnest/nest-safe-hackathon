import { Memory, State } from "@elizaos/core";

import { Provider } from "@elizaos/core";

import { IAgentRuntime } from "@elizaos/core";
import { AiAgentData, OneAgentResponse, PaginatedAgentsResponse } from "../types";


class CookieApi {
    private readonly apiKey: string = '';
    private readonly runtime: IAgentRuntime;

    constructor(apiKey: string, runtime: IAgentRuntime) {
        this.apiKey = apiKey;
        this.runtime = runtime;
    }

    private headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
    };

    public async getAgentDataByAddress(address: string): Promise<AiAgentData | null> {
        const cacheKey = `coockie/client/agent_data_${address}`;
        const cachedData = await this.runtime.cacheManager.get(cacheKey);
        if (cachedData) {
            return cachedData as AiAgentData;
        }
        const data = await this.request<OneAgentResponse>(
            `/v2/agents/contractAddress/${address}`,
            { interval: '_3Days' }
        );
        if (!data.success) {
            return null;
        }
        await this.runtime.cacheManager.set(cacheKey, data.ok, { expires: 60 * 60 * 0.5 }); // 30 minutes
        return data.ok;
    }

    public async getAllAgents(): Promise<AiAgentData[] | null> {
        const cacheKey = `coockie/client/all_agents`;
        const cachedData = await this.runtime.cacheManager.get(cacheKey);
        if (cachedData) {
            return cachedData as AiAgentData[];
        }
        const pageSize = 25;
        let page = 1;
        let allAgents: AiAgentData[] = [];

        while (true) {
            const data = await this.request<PaginatedAgentsResponse>(
                `/v2/agents/agentsPaged`,
                { interval: '_3Days', pageSize: pageSize, page: page }
            );

            if (!data.success) {
                return null;
            }

            allAgents = [...allAgents, ...data.ok.data];

            if (page >= data.ok.totalPages) {
                break;
            }

            page++;
        }
        await this.runtime.cacheManager.set(cacheKey, allAgents, { expires: 60 * 60 * 0.5 }); // 30 minutes

        return allAgents;
    }

    public async getAgents(page: number, pageSize: number): Promise<AiAgentData[] | null> {
        const cacheKey = `coockie/client/agents_${page}_${pageSize}`;
        const cachedData = await this.runtime.cacheManager.get(cacheKey);
        if (cachedData) {
            return cachedData as AiAgentData[];
        }
        const data = await this.request<PaginatedAgentsResponse>(
            `/v2/agents/agentsPaged`,
            { interval: '_3Days', pageSize: pageSize, page: page }
        );
        if (!data.success) {
            return null;
        }
        await this.runtime.cacheManager.set(cacheKey, data.ok.data, { expires: 60 * 60 * 0.5 }); // 30 minutes
        return data.ok.data;
    }

    public async getAgentDataByName(name: string): Promise<AiAgentData | null> {
        const cacheKey = `coockie/client/agent_data_${name}`;
        const cachedData = await this.runtime.cacheManager.get(cacheKey);
        if (cachedData) {
            return cachedData as AiAgentData;
        }
        const data = await this.request<OneAgentResponse>(
            `/v2/agents/twitterUsername/${name}`,
            { interval: '_3Days' }
        );
        if (!data.success) {
            return null;
        }
        await this.runtime.cacheManager.set(cacheKey, data.ok, { expires: 60 * 60 * 0.5 }); // 30 minutes
        return data.ok;
    }

    private async request<T>(url: string, queryParams?: object): Promise<T> {
        const queryString = Object.entries(queryParams || {}).map(([key, value]) => `${key}=${value}`).join('&');
        const response = await fetch(`https://api.cookie.fun${url}?${queryString}`, {
            method: 'GET',
            headers: this.headers,
        });
        return response.json();
    }
}


export const initCookieApi = (runtime: IAgentRuntime) => {
    const apiKey = runtime.getSetting("COOKIE_API_KEY");
    if (!apiKey) {
        throw new Error("COOKIE_API_KEY is missing");
    }

    return new CookieApi(apiKey, runtime);
};

export const coockeiApiProvider: Provider = {
    async get(
        runtime: IAgentRuntime,
        _message: Memory,
        _state?: State
    ): Promise<CookieApi | null> {
        try {
            const cookieApi = initCookieApi(runtime);
            return cookieApi;
        } catch (error) {
            console.error("Error in Cookie API provider:", error);
            return null;
        }
    },
};
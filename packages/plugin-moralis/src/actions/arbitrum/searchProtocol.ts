import {
    Action,
    composeContext,
    elizaLogger,
    generateText,
    HandlerCallback,
    ModelClass,
    State,
} from "@elizaos/core";

import { Memory } from "@elizaos/core";

import { IAgentRuntime } from "@elizaos/core";
import { validateMoralisConfig } from "../../environment";
import { searchProtocolTemplate } from "../../templates/searchProtocolTemplate";
import { SearchProtocolContent, SearchQueryResult } from "../../types/arbitrum";
import { API_ENDPOINTS } from "../../utils/constants";

export const searchProtocol: Action = {
    name: "SEARCH_PROTOCOL",
    similes: ["SEARCH_PROTOCOL", "ANALYZE_PROTOCOL"],
    validate: async (runtime: IAgentRuntime, _message: Memory) => {
        await validateMoralisConfig(runtime);
        return true;
    },
    description:
        "Search for more information about a crypto/blockchian protocol. Use this when a user wants to learn more about a protocol",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        const config = await validateMoralisConfig(runtime);
        const headers = {
            "X-API-Key": config.MORALIS_API_KEY,
            "Content-Type": "application/json",
        };

        let currentState: State;
        if (!state) {
            currentState = (await runtime.composeState(message)) as State;
        } else {
            currentState = await runtime.updateRecentMessageState(state);
        }

        try {
            elizaLogger.log("Composing search protocol context...");
            const searchProtocolContext = composeContext({
                state: currentState,
                template: searchProtocolTemplate,
            });

            elizaLogger.log("searchProtocolContext", searchProtocolContext);

            const content = (await generateText({
                runtime,
                context: searchProtocolContext,
                modelClass: ModelClass.LARGE,
                customTemperature: 0.1,
            })) as unknown as SearchProtocolContent;

            elizaLogger.log("Content RESPONSE from LLM:", content);

            const parsedContent = JSON.parse(content as unknown as string);

            elizaLogger.log(
                "Stringified Content RESPONSE from LLM:",
                parsedContent
            );
            elizaLogger.log(
                "parsedContent.protocolName:",
                parsedContent.protocolName
            );

            if (!parsedContent || typeof parsedContent !== "object") {
                throw new Error("Invalid response format from model");
            }

            if (!parsedContent.protocolName) {
                throw new Error("No protocol name provided");
            }

            elizaLogger.log("Fetching protocol stats...");

            const protocol = await fetch(
                API_ENDPOINTS.ARBITRUM.SEARCH_PROTOCOL(
                    parsedContent.protocolName.toLowerCase()
                ),
                {
                    headers,
                }
            );

            if (!protocol.ok) {
                const errorText = await protocol.text();
                elizaLogger.error("API error response:", errorText);
                throw new Error(
                    `API request failed with status ${protocol.status}: ${errorText}`
                );
            }

            const responseText = await protocol.text();
            elizaLogger.log("Raw API response:", responseText);

            if (!responseText) {
                throw new Error("Empty response from API");
            }

            const protocolResult = (await protocol.json()) as SearchQueryResult;

            const entity = protocolResult.result.entities[0];

            if (!entity) {
                callback?.({
                    text: "No protocol found",
                });
                return false;
            }

            callback?.({
                text: entity.description ?? entity.bio,
                content: {
                    protocol: entity.name,
                    protocolData: entity,
                    addresses: protocolResult.result.addresses,
                },
            });

            elizaLogger.success(
                `Successfully fetched stats for protocol ${entity.name}`
            );
        } catch (error) {
            elizaLogger.error("Error searching for protocol", error);
            return false;
        }
        return true;
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "What is Uniswap?" },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Uniswap is a decentralized exchange protocol on the Arbitrum blockchain.",
                    additional_info: {
                        protocol: "Uniswap",
                        addresses: [
                            {
                                address:
                                    "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
                                chain: "0x1",
                                is_multi_chain: false,
                                primary_label: "Uniswap (UNI)",
                            },
                        ],
                    },
                    action: "GET_ARBITRUM_SEARCH_PROTOCOL",
                },
            },
        ],
    ],
};

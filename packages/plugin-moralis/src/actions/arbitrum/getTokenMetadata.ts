import {
    ActionExample,
    composeContext,
    elizaLogger,
    generateObjectDeprecated,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    ModelClass,
    State,
    type Action,
} from "@elizaos/core";
import axios from "axios";
import { validateMoralisConfig } from "../../environment";
import { getTokenMetadataTemplateArbitrum } from "../../templates/tokenMetadata";
import { API_ENDPOINTS } from "../../utils/constants";
import { TokenMetadata, TokenMetadataContent } from "../../types/arbitrum";

export default {
    name: "GET_ARBITRUM_TOKEN_METADATA",
    similes: [
        "CHECK_ARBITRUM_TOKEN_INFO",
        "GET_ARBITRUM_TOKEN_SUPPLY",
        "CHECK_ARBITRUM_TOKEN_FDV",
        "SHOW_ARBITRUM_TOKEN_METADATA",
    ],
    validate: async (runtime: IAgentRuntime, _message: Memory) => {
        await validateMoralisConfig(runtime);
        return true;
    },
    description:
        "Get token metadata including supply, FDV, and other details on Arbitrum blockchain",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        elizaLogger.log(
            "Starting Moralis GET_ARBITRUM_TOKEN_METADATA handler..."
        );

        // Initialize or update state
        let currentState: State;
        if (!state) {
            currentState = (await runtime.composeState(message)) as State;
        } else {
            currentState = await runtime.updateRecentMessageState(state);
        }

        try {
            elizaLogger.log("Composing token metadata context...");
            const metadataContext = composeContext({
                state: currentState,
                template: getTokenMetadataTemplateArbitrum,
            });

            elizaLogger.log("Extracting token address...");
            const content = (await generateObjectDeprecated({
                runtime,
                context: metadataContext,
                modelClass: ModelClass.LARGE,
            })) as unknown as TokenMetadataContent;

            if (!content || typeof content !== "object") {
                throw new Error("Invalid response format from model");
            }

            if (!content.tokenAddress) {
                throw new Error("No Arbitrum token address provided");
            }

            const config = await validateMoralisConfig(runtime);
            elizaLogger.log(
                `Fetching metadata for Arbitrum token ${content.tokenAddress}...`
            );

            const response = await axios.get<TokenMetadata>(
                API_ENDPOINTS.ARBITRUM.TOKEN_METADATA(content.tokenAddress),
                {
                    headers: {
                        "X-API-Key": config.MORALIS_API_KEY,
                        accept: "application/json",
                    },
                }
            );

            const metadata = response.data;
            elizaLogger.success(
                `Successfully fetched metadata for token ${content.tokenAddress}`
            );

            if (callback) {
                const formattedText = [
                    'Token Metadata:\n',
                    `Name: ${metadata.name} (${metadata.symbol})`,
                    `Token Address: ${metadata.address}`,
                    `Total Supply: ${metadata.total_supply_formatted}`,
                    `Fully Diluted Value: $${Number(metadata.fully_diluted_valuation).toLocaleString()}`,
                    `Decimals: ${metadata.decimals}\n`,
                    `Logo: ${metadata.logo}`,
                    `Thumbnail: ${metadata.thumbnail}`,
                    `Block Number: ${metadata.block_number}`,
                    `Validated: ${metadata.validated}`,
                    `Created At: ${metadata.created_at}`,
                    `Possible Spam: ${metadata.possible_spam}`,
                    `Verified Contract: ${metadata.verified_contract}`,
                ].join('\n');

                callback({
                    text: formattedText,
                    content: metadata,
                });
            }

            return true;
        } catch (error: unknown) {
            elizaLogger.error(
                "Error in GET_ARBITRUM_TOKEN_METADATA handler:",
                error
            );
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (callback) {
                callback({
                    text: `Error fetching Arbitrum token metadata: ${errorMessage}`,
                    content: { error: errorMessage },
                });
            }
            return false;
        }
    },

    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "What's the FDV and total supply of 0x37a645648df29205c6261289983fb04ecd70b4b3?",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll fetch the token metadata including supply and FDV information.",
                    action: "GET_ARBITRUM_TOKEN_METADATA",
                },
            },
        ],
    ] as ActionExample[][],
} as Action;

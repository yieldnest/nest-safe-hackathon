import {
    type Action,
    type HandlerCallback,
    type IAgentRuntime,
    type Memory,
    ModelClass,
    type State,
    composeContext,
    elizaLogger,
    generateText,
    parseJSONObjectFromText,
} from "@elizaos/core";
import { parseEther, formatEther, formatGwei, type Address } from "viem";
import { arbitrum } from "viem/chains";
import { extractTxInfoTemplate } from "../templates";

export const routeSwapAction: Action = {
    name: "ROUTE_SWAP",
    description:
        "Sets up a token swap through Enso's API to find the best execution path. Use this if a user wants to send a transaction, swap tokens, transfer tokens, or deposit into a strategy.",
    similes: ["swap tokens", "exchange tokens", "trade tokens"],
    examples: [
        [
            {
                user: "{{user}}",
                content: { text: "swap 1 ETH to USDC" },
            },
            {
                user: "{{user}}",
                content: { text: "deposit 0.5 ETH to ynETHx" },
            },
            {
                user: "{{user}}",
                content: { text: "withdraw 0.75 ETH from Aave v3 wETH" },
            },
        ],
    ],
    validate: async () => true,
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State | undefined,
        options?: Record<string, unknown>,
        callback?: HandlerCallback
    ): Promise<boolean> => {
        try {
            // Get required parameters
            // const fromAddress = options?.fromAddress as string;
            // const tokenIn = options?.tokenIn as string;
            // const tokenOut = options?.tokenOut as string;
            // const amountIn = options?.amountIn as string;
            // const chainId = options?.chainId || "42161";

            // if (!fromAddress) {
            //     throw new Error("fromAddress is required");
            // }
            // if (!tokenIn || !tokenOut || !amountIn) {
            //     throw new Error(
            //         "tokenIn, tokenOut, and amountIn are required parameters"
            //     );
            // }

            const apiKey = runtime.getSetting("ENSO_API_KEY");
            if (!apiKey) {
                throw new Error("ENSO_API_KEY not found in environment");
            }

            const state = await runtime.composeState(message);

            const context = await composeContext({
                state,
                template: extractTxInfoTemplate,
            });

            console.log("enso request", context);

            const responseParams = await generateText({
                runtime,
                context: context,
                modelClass: ModelClass.LARGE,
                customTemperature: 0.1,
            });

            if (!responseParams) {
                callback({
                    text: "Failed to extract vault information from message",
                });
                return;
            }

            const parsedResponse = parseJSONObjectFromText(responseParams);

            console.log("Full responseParams:", responseParams);
            console.log(
                "Parsed Response Object:",
                JSON.stringify(parsedResponse, null, 2)
            );

            const fromAddress = parsedResponse.fromAddress as Address;
            const tokenIn = parsedResponse.tokenIn as Address;
            const tokenOut = parsedResponse.tokenOut as Address;
            const amountIn = parseEther(parsedResponse.amountIn);
            const spender = parsedResponse.fromAddress as Address;
            const receiver = parsedResponse.receiver
                ? (parsedResponse.receiver as Address)
                : (parsedResponse.fromAddress as Address);
            const priceImpact = (options?.priceImpact as boolean) || false;
            const slippage = (options?.slippage as number) || 300;

            console.log("fromAddress:", fromAddress);
            console.log("tokenIn:", tokenIn);
            console.log("amountIn:", amountIn);

            const requestUrl = `https://api.enso.finance/api/v1/shortcuts/route?chainId=${arbitrum.id}&fromAddress=${fromAddress}&spender=${spender}&receiver=${receiver}&priceImpact=${priceImpact}&amountIn=${amountIn}&slippage=${slippage}&tokenIn=${tokenIn}&tokenOut=${tokenOut}&routingStrategy=delegate`;

            elizaLogger.log("Request URL:", requestUrl);

            // Make request to Enso API
            const response = await fetch(requestUrl, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    `Enso API error: ${errorData.message || response.statusText}`
                );
            }
            const data = await response.json();

            data.tx.gas = data.gas;
            console.log("enso response", data);

            // Format the response for the user
            const resultMessage = `Quote received:
From: ${tokenIn}
To: ${tokenOut}
Amount In: ${formatEther(amountIn).toString()}
Estimated Amount Out: ${formatEther(data.amountOut).toString() || "Not available"}
Gas Estimate: ${formatGwei(data.gas).toString() || "Not available"}`;

            callback?.({
                text: resultMessage,
                content: {
                    success: true,
                    data: data,
                    quote: {
                        tokenIn,
                        tokenOut,
                        amountIn: formatEther(amountIn).toString(),
                        estimatedAmountOut: formatEther(
                            data.amountOut
                        ).toString(),
                        gasEstimate: formatGwei(data.gas).toString(),
                    },
                },
            });

            return true;
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : String(error);
            callback?.({
                text: `Error routing token swap: ${errorMessage}`,
                content: { error: errorMessage },
            });
            return false;
        }
    },
};

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
import {
    type Address,
    createPublicClient,
    erc20Abi,
    formatEther,
    formatGwei,
    formatUnits,
    http,
    parseEther,
    parseUnits,
} from "viem";
import { arbitrum } from "viem/chains";
import { verifyTxEvaluator } from "../evaluators/verifytx";
import { type VerificationResult } from "../index";
import { extractTxInfoTemplate } from "../templates";

const ETH_ADDRESS = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

export const routeSwapAction: Action = {
    name: "PREPARE_TOKEN_SWAP",
    description:
        "Sets up a token swap through Enso's API to find the best execution path. Use this if a user wants to send a transaction, swap tokens, transfer tokens, or deposit into a strategy.",
    similes: ["swap tokens", "exchange tokens", "trade tokens", "propose", "suggest"],
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
            const apiKey = runtime.getSetting("ENSO_API_KEY");
            if (!apiKey) {
                throw new Error("ENSO_API_KEY not found in environment");
            }
            const rpcUrl = runtime.getSetting("EVM_PROVIDER_URL");
            if (!rpcUrl) {
                throw new Error("EVM_PROVIDER_URL not found in environment");
            }

            const publicClient = createPublicClient({
                chain: arbitrum,
                transport: http(rpcUrl),
            });

            // Get decimals for input token
            const getTokenDecimals = async (
                tokenAddress: Address
            ): Promise<number> => {
                if (tokenAddress.toLowerCase() === ETH_ADDRESS) {
                    return 18;
                }
                return publicClient.readContract({
                    address: tokenAddress,
                    abi: erc20Abi,
                    functionName: "decimals",
                });
            };

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

            const tokenInDecimals = await getTokenDecimals(tokenIn);
            elizaLogger.log("tokenInDecimals", tokenInDecimals);

            const tokenOutDecimals = await getTokenDecimals(tokenOut);
            elizaLogger.log("tokenOutDecimals", tokenOutDecimals);

            const amountIn = parseUnits(
                parsedResponse.amountIn,
                tokenInDecimals
            );
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

            const verificationResult = await verifyTxEvaluator.handler(
                runtime,
                message,
                state,
                {
                    ...options,
                    resultData: data,
                }
            );

            console.log("verificationResult", verificationResult);

            if (!(verificationResult as VerificationResult).isValid) {
                const transactionDetails = `
              Transaction Details to Verify:
              - From Address: ${parsedResponse.fromAddress}
              - To Address: ${parsedResponse.receiver}
              - Amount to Send: ${parsedResponse.amountIn}
              - Token to Sell: ${parsedResponse.tokenIn}
              - Token to Receive: ${parsedResponse.tokenOut}
              - Network: ${parsedResponse.network}`;

                callback?.({
                    text: `Please verify these transaction details and let me know if anything needs to be corrected:\n${transactionDetails}\n\nIf any information is incorrect, please provide the correct details and I'll update the transaction accordingly.`,

                    content: {
                        success: false,
                        mismatches: (verificationResult as VerificationResult)
                            .mismatches,
                        availableFields: (
                            verificationResult as VerificationResult
                        ).availableFields,
                        requiresRefetch: true,
                        currentValues: {
                            fromAddress,
                            receiver,
                        },
                    },
                });
                return false;
            }

            // Format the response for the user
            const resultMessage = `Proposed Transaction:
Token to sell: ${tokenIn}
Token to Receive: ${tokenOut}
From address: ${fromAddress}
To address: ${receiver}
Amount to transact: ${formatUnits(amountIn, tokenInDecimals).toString()}
Estimated Amount Out: ${formatUnits(data.amountOut, tokenOutDecimals).toString() || "Not available"}
Gas Estimate: ${formatGwei(data.gas).toString() || "Not available"}

If you are ready to proceed, press the swap button to execute the transaction.
`;

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

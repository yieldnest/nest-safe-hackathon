import {
    type Action,
    type HandlerCallback,
    type IAgentRuntime,
    type Memory,
    type State,
} from '@elizaos/core';

export const routeSwapAction: Action = {
    name: "ROUTE_SWAP",
    description: "Routes a token swap through Enso's API to find the best execution path",
    similes: ["swap tokens", "exchange tokens", "trade tokens"],
    examples: [
        [
            {
                user: "{{user}}",
                content: { text: "swap 1 ETH to USDC" },
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
            const fromAddress = options?.fromAddress as string;
            const tokenIn = options?.tokenIn as string;
            const tokenOut = options?.tokenOut as string;
            const amountIn = options?.amountIn as string;
            const chainId = options?.chainId || "42161";
            const spender = options?.spender as string || fromAddress;
            const receiver = options?.receiver as string || fromAddress;
            const priceImpact = options?.priceImpact as boolean || false;
            const slippage = options?.slippage as number || 300;

            if (!fromAddress) {
                throw new Error("fromAddress is required");
            }
            if (!tokenIn || !tokenOut || !amountIn) {
                throw new Error("tokenIn, tokenOut, and amountIn are required parameters");
            }

            const apiKey = runtime.getSetting("ENSO_API_KEY");
            if (!apiKey) {
                throw new Error("ENSO_API_KEY not found in environment");
            }

            const requestUrl = `https://api.enso.finance/api/v1/shortcuts/route?chainId=${chainId}&fromAddress=${fromAddress}&spender=${spender}&receiver=${receiver}&priceImpact=${priceImpact}&amountIn=${amountIn}&slippage=${slippage}&tokenIn=${tokenIn}&tokenOut=${tokenOut}&routingStrategy=delegate`;

            // Make request to Enso API
            const response = await fetch(requestUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Enso API error: ${errorData.message || response.statusText}`);
            }
            const data = await response.json();

            // Format the response for the user
            const resultMessage = `Quote received:
From: ${tokenIn}
To: ${tokenOut}
Amount In: ${amountIn}
Estimated Amount Out: ${data.amountOut || 'Not available'}
Gas Estimate: ${data.gas || 'Not available'}`;

            callback?.({
                text: resultMessage,
                content: {
                    success: true,
                    data: data,
                    quote: {
                        tokenIn,
                        tokenOut,
                        amountIn,
                        estimatedAmountOut: data.amountOut,
                        gasEstimate: data.gas
                    }
                }
            });

            return true;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            callback?.({
                text: `Error routing token swap: ${errorMessage}`,
                content: { error: errorMessage },
            });
            return false;
        }
    },
}; 
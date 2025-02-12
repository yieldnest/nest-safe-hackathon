import {
    type Action,
    type HandlerCallback,
    type IAgentRuntime,
    type Memory,
    type State,
} from '@elizaos/core';

export const routeSwapAction: Action = {
    name: "ROUTE_TOKEN_SWAP",
    description: "Routes a token swap through Enso's Router API to find the best execution path",
    similes: ["swap tokens", "exchange tokens", "trade tokens", "convert tokens"],
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
            const userAddress = options?.ownerAddress as string;
            const tokenIn = options?.tokenIn as string;
            const tokenOut = options?.tokenOut as string;
            const amountIn = options?.amountIn as string;
            const chainId = options?.chainId || "1"; // Default to Ethereum mainnet

            if (!userAddress) {
                throw new Error("User's wallet address is required");
            }
            if (!tokenIn || !tokenOut || !amountIn) {
                throw new Error("tokenIn, tokenOut, and amountIn are required parameters");
            }

            // Get API key from runtime settings
            const apiKey = runtime.getSetting("ENSO_API_KEY");
            if (!apiKey) {
                throw new Error("ENSO_API_KEY not found in settings");
            }

            // Prepare the request body
            const requestBody = [{
                protocol: "enso",
                action: "route",
                args: {
                    tokenIn,
                    tokenOut,
                    amountIn
                }
            }];

            // Make request to Enso API
            const response = await fetch(
                `https://api.enso.finance/api/v1/shortcuts/bundle?chainId=${chainId}&fromAddress=${userAddress}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify(requestBody)
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Enso API error: ${errorData.message || response.statusText}`);
            }

            const data = await response.json();

            // Format the response for the user
            const resultMessage = `Swap route found:
From: ${tokenIn}
To: ${tokenOut}
Amount In: ${amountIn}
Expected Output: ${data.expectedOutput || 'Not available'}
Route Path: ${data.path?.join(' -> ') || 'Direct swap'}
Gas Estimate: ${data.gasEstimate || 'Not available'}`;

            callback?.({
                text: resultMessage,
                content: {
                    success: true,
                    data: data,
                    route: {
                        tokenIn,
                        tokenOut,
                        amountIn,
                        expectedOutput: data.expectedOutput,
                        path: data.path,
                        gasEstimate: data.gasEstimate
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
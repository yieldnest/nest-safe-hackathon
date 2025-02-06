import { Action, IAgentRuntime, Memory, State } from "@elizaos/core";
import { safeManager } from "../providers/safe-wallet";
import { privateKeyToAccount } from 'viem/accounts';

export const createSafeAction: Action = {
    name: "createSafe",
    description: "Creates a new Safe wallet with the user and Nest as signers",
    
    async handler(
        runtime: IAgentRuntime,
        _message: Memory,
        _state: State,
        options: { ownerAddress: string },
        callback?: (response: { text: string; content?: Record<string, any> }) => void
    ) {
        try {
            // Initialize the Safe manager if not already initialized
            await safeManager.initialize(runtime);

            // Get Nest's private key and derive its address
            const nestPrivateKey = runtime.getSetting("EVM_PRIVATE_KEY");
            if (!nestPrivateKey) {
                throw new Error("Nest's private key not found in environment");
            }

            // Derive Nest's address from private key using viem
            const formattedPrivateKey = nestPrivateKey.startsWith('0x') ? nestPrivateKey : `0x${nestPrivateKey}`;
            const nestAccount = privateKeyToAccount(formattedPrivateKey as `0x${string}`);
            const nestAddress = nestAccount.address;

            // Get user's address from options (passed from RainbowKit)
            const { ownerAddress } = options;
            if (!ownerAddress) {
                throw new Error("User's wallet address not provided");
            }

            // Create the Safe using the manager
            const safeAddress = await safeManager.createSafe(ownerAddress, nestAddress);

            const response = {
                text: `Successfully created Safe wallet at address: ${safeAddress}. This Safe is controlled by you (${ownerAddress}) and Nest (${nestAddress}). Both signatures will be required for any transaction.`,
                content: {
                    success: true,
                    safeAddress,
                    owners: [ownerAddress, nestAddress],
                    threshold: 2
                }
            };

            if (callback) {
                callback(response);
            }
            return true;

        } catch (error) {
            console.error("Error in createSafe action:", error);
            const errorResponse = {
                text: `Failed to create Safe wallet: ${error.message}`,
                content: { error: error.message }
            };
            
            if (callback) {
                callback(errorResponse);
            }
            return false;
        }
    },

    validate: async (runtime: IAgentRuntime) => {
        const privateKey = runtime.getSetting("EVM_PRIVATE_KEY");
        return typeof privateKey === "string" && privateKey.startsWith("0x");
    },

    examples: [
        [
            {
                user: "user",
                content: {
                    text: "Create a new Safe wallet for me and Nest",
                    action: "CREATE_SAFE"
                }
            }
        ]
    ],
    similes: ["CREATE_SAFE", "SETUP_SAFE", "NEW_SAFE"]
}; 
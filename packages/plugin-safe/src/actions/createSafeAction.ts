
  


  // src/actions/createSafeAction.ts
import {
    type Action,
    type HandlerCallback,
    type IAgentRuntime,
    type Memory,
    type State
  } from '@elizaos/core';
  import Safe, {
    PredictedSafeProps,
    SafeAccountConfig,
    SafeDeploymentConfig
  } from '@safe-global/protocol-kit';
  import { privateKeyToAccount } from 'viem/accounts';
  
  interface ExtendedSafeDeploymentConfig extends SafeDeploymentConfig {
    deploymentType?: 'canonical'; // or a union of acceptable values
  }

  const RPC_URL = 'https://rpc.ankr.com/eth_sepolia';
  
  export const createSafeAction: Action = {
    name: "CREATE_SAFE_ACCOUNT",
    description: "Creates a new Safe smart account for the agent using the provided signer credentials.",
    similes: ["make a new safe smart account", "create a safe wallet", "set up a new safe account"],
    examples: [[
        { user: "{{user}}", content: { text: "create a new safe smart account" }}
      ]],
    validate: async () => true,
    handler: async (
      runtime: IAgentRuntime,
      message: Memory,
      state: State | undefined,
      options?: Record<string, unknown>,
      callback?: HandlerCallback
    ): Promise<boolean> => {
      try {
        // Get Nest's private key from environment
        const nestPrivateKey = runtime.getSetting("EVM_PRIVATE_KEY");
        if (!nestPrivateKey) {
            throw new Error("Missing EVM_PRIVATE_KEY for Nest");
        }

        // Get user's wallet address from options
        const userAddress = options?.ownerAddress as string;
        if (!userAddress) {
            throw new Error("User's wallet address is required");
        }

        // Format Nest's private key and derive address
        const formattedPrivateKey = nestPrivateKey.startsWith('0x')
            ? nestPrivateKey
            : `0x${nestPrivateKey}`;
        const nestAccount = privateKeyToAccount(formattedPrivateKey as `0x${string}`);
        const nestAddress = nestAccount.address;


        // Configure the Safe account with both owners
        const safeAccountConfig: SafeAccountConfig = {
            owners: [userAddress, nestAddress],
            threshold: 2,
        };
  
        // Optionally, configure deployment parameters
        // const safeDeploymentConfig: ExtendedSafeDeploymentConfig = {
        //     saltNonce: '123',
        //     safeVersion: '1.4.1',
        //     deploymentType: 'canonical'
        //   };
  
        // Build the predicted safe configuration
        const predictedSafe: PredictedSafeProps = {
          safeAccountConfig,
          // safeDeploymentConfig // This property is optional
        };
  
        // Initialize the new safe using the predictedSafe configuration
        // Note: Remove any 'safeAddress' parameter. Instead, pass 'predictedSafe'.
        const protocolKit = await (Safe as any).init({
          provider: RPC_URL,
          signer: nestPrivateKey,
          predictedSafe,
          isL1SafeSingleton: true,
          // Optionally: contractNetworks, etc.
        });
  
        // Optionally, get the computed safe address (if the API provides it)
        const safeAddress = protocolKit.getAddress ? await protocolKit.getAddress() : "unknown";
  
        const resultMessage = `Safe smart account created successfully. Address: ${safeAddress}`;
        callback?.({ text: resultMessage, content: { safeAddress } });
        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        callback?.({ text: `Error creating safe account: ${errorMessage}`, content: { error: errorMessage } });
        return false;
      }
    },
  };
  
  export default createSafeAction;
  
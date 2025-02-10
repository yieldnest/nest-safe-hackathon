// src/actions/checkSafeAction.ts

import {
  type Action,
  type HandlerCallback,
  type IAgentRuntime,
  type Memory,
  type State,
} from '@elizaos/core';

import Safe from '@safe-global/protocol-kit';
import { sepolia } from 'viem/chains';
import { createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const RPC_URL = 'https://rpc.ankr.com/eth_sepolia';

export const checkSafeAction: Action = {
  name: "CHECK_SAFE_ACCOUNT",
  description: "Checks if a Safe exists with joint ownership between the user and Nest.",
  similes: ["check safe account", "check safe", "inspect safe", "verify safe"],
  examples: [
    [
      { user: "{{user}}", content: { text: "check your safe account" } }
    ]
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
      // Get user's wallet address from options
      const userAddress = options?.ownerAddress as string;
      if (!userAddress) {
          throw new Error("User's wallet address is required");
      }

      // Get Nest's private key and derive address
      const nestPrivateKey = runtime.getSetting("EVM_PRIVATE_KEY");
      if (!nestPrivateKey) {
          throw new Error("Missing EVM_PRIVATE_KEY for Nest");
      }

      const formattedPrivateKey = nestPrivateKey.startsWith('0x')
          ? nestPrivateKey
          : `0x${nestPrivateKey}`;
      const nestAccount = privateKeyToAccount(formattedPrivateKey as `0x${string}`);
      const nestAddress = nestAccount.address;

      // Initialize the Protocol Kit with the predicted safe configuration.
      // (Using (Safe as any).init() for simplicity. In production, create a proper signer instance.)
      const protocolKit = await (Safe as any).init({
        provider: RPC_URL,
        signer: formattedPrivateKey,
        predictedSafe: {
          safeAccountConfig: {
            owners: [userAddress, nestAddress],
            threshold: 2
          }
        },
        isL1SafeSingleton: true,
      });

      // Get the predicted Safe address and check if it's deployed
      const safeAddress = await protocolKit.getAddress();
      const connectedKit = await protocolKit.connect({ safeAddress });
      const isSafeDeployed = await connectedKit.isSafeDeployed();
      const deployedSafeAddress = await connectedKit.getAddress();
      const safeOwners = await connectedKit.getOwners();
      const safeThreshold = await connectedKit.getThreshold();

      let resultMessage = "";
      if (isSafeDeployed) {
        resultMessage = `Safe account already exists!
        Safe address: ${deployedSafeAddress}.
        Owners: ${safeOwners.join(', ')}.
        Threshold: ${safeThreshold}.`;
      } else {
        resultMessage = `No Safe account deployed at the predicted address: ${safeAddress}.`;
      }

      callback?.({
        text: resultMessage,
        content: {
          isSafeDeployed,
          safeAddress: deployedSafeAddress,
          safeOwners,
          safeThreshold
        },
      });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      callback?.({
        text: `Error checking safe account: ${errorMessage}`,
        content: { error: errorMessage },
      });
      return false;
    }
  },
};

export default checkSafeAction;

import {
  type Action,
  type HandlerCallback,
  type IAgentRuntime,
  type Memory,
  type State,
} from '@elizaos/core';

import SafeAPIKitImport from '@safe-global/api-kit';
import { privateKeyToAccount } from 'viem/accounts';
import { transactionServiceConfig } from '../index.js';
const SafeApiKit = SafeAPIKitImport.default;

export const getPendingTransactionsAction: Action = {
  name: "GET_PENDING_TRANSACTIONS",
  description: "Retrieves pending transactions for a Safe account",
  similes: ["get pending transactions", "check pending transactions", "list pending transactions"],
  examples: [
      [
          {
              user: "{{user}}",
              content: { text: "check pending transactions" },
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
          const safeAddress = options?.safeAddress as string;
          if (!safeAddress) {
              throw new Error("safeAddress is required");
          }

          // Get Nest's private key from environment
          const nestPrivateKey = runtime.getSetting("EVM_PRIVATE_KEY");
          if (!nestPrivateKey) {
              throw new Error("Missing EVM_PRIVATE_KEY for Nest");
          }

          // Format Nest's private key and derive address
          const formattedPrivateKey = nestPrivateKey.startsWith('0x')
              ? nestPrivateKey
              : `0x${nestPrivateKey}`;
          const nestAccount = privateKeyToAccount(formattedPrivateKey as `0x${string}`);
          const nestAddress = nestAccount.address;

          // Initialize API Kit
          const apiKit = new SafeApiKit({
              chainId: transactionServiceConfig.chainId,
              txServiceUrl: transactionServiceConfig.txServiceUrl
          });

          // Get pending transactions
          const pendingTransactions = await apiKit.getPendingTransactions(safeAddress);

          callback?.({
              text: `Found ${pendingTransactions.count} pending transactions for Safe ${safeAddress}`,
              content: {
                  success: true,
                  transactions: pendingTransactions.results,
                  nestAddress
              }
          });

          return true;
      } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          callback?.({
              text: `Error getting pending transactions: ${errorMessage}`,
              content: { error: errorMessage },
          });
          return false;
      }
  },
};

export default getPendingTransactionsAction;

import {
  type Action,
  type HandlerCallback,
  type IAgentRuntime,
  type Memory,
  type State,
} from '@elizaos/core';

import Safe from '@safe-global/protocol-kit';
import SafeAPIKitImport from '@safe-global/api-kit'
import { transactionServiceConfig } from '../index.js';

const SafeApiKit = SafeAPIKitImport.default

export const executeTransactionAction: Action = {
  name: "EXECUTE_SAFE_TRANSACTION",
  description: "Executes a Safe transaction that has all required signatures",
  similes: ["execute transaction", "process transaction", "complete transaction"],
  examples: [
      [
          {
              user: "{{user}}",
              content: { text: "execute the pending transaction" },
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
          const rpcUrl = runtime.getSetting("EVM_PROVIDER_URL");
          if (!nestPrivateKey || !rpcUrl) {
              throw new Error("Missing EVM_PRIVATE_KEY or EVM_PROVIDER_URL for Nest");
          }

          // Format Nest's private key
          const formattedPrivateKey = nestPrivateKey.startsWith('0x')
              ? nestPrivateKey
              : `0x${nestPrivateKey}`;

          // Initialize Safe API Kit
          const apiKit = new SafeApiKit({
              chainId: transactionServiceConfig.chainId,
              txServiceUrl: transactionServiceConfig.txServiceUrl
          });

          // Get pending transactions
          const pendingTransactions = await apiKit.getPendingTransactions(safeAddress);
          
          if (pendingTransactions.results.length === 0) {
              throw new Error("No pending transactions found");
          }

          // Get the first pending transaction that has all required confirmations
          const readyToExecuteTx = pendingTransactions.results.find(tx => 
              !tx.isExecuted && 
              tx.confirmations && 
              tx.confirmations.length >= tx.confirmationsRequired
          );

          if (!readyToExecuteTx) {
              throw new Error("No transactions ready to execute (need more signatures)");
          }

          // Initialize Safe instance
          const safe = await (Safe as any).init({
              provider: rpcUrl,
              signer: formattedPrivateKey,
              safeAddress: safeAddress,
              isL1SafeSingleton: true,
          });

          // Get the transaction details from the Safe Transaction Service
          const safeTransaction = await apiKit.getTransaction(readyToExecuteTx.safeTxHash);
          // Execute the transaction
          const executeTxResponse = await safe.executeTransaction(safeTransaction);

          console.log('executeTxResponse', executeTxResponse)
          const resultMessage = `Transaction executed successfully:
Safe Transaction Hash: ${readyToExecuteTx.safeTxHash}
Transaction Hash: ${executeTxResponse.hash}`;

          callback?.({
              text: resultMessage,
              content: {
                  success: true,
                  safeTxHash: readyToExecuteTx.safeTxHash,
                  executionHash: executeTxResponse.hash
              }
          });

          return true;
      } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          callback?.({
              text: `Error executing transaction: ${errorMessage}`,
              content: { error: errorMessage },
          });
          return false;
      }
  },
};

export default executeTransactionAction;

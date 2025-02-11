import {
  type Action,
  type HandlerCallback,
  type IAgentRuntime,
  type Memory,
  type State,
} from '@elizaos/core';

import Safe from '@safe-global/protocol-kit';
import { OperationType, SafeTransactionDataPartial } from '@safe-global/safe-core-sdk-types';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import { createPublicClient, http } from 'viem';
import SafeAPIKitImport from '@safe-global/api-kit'

const SafeApiKit = SafeAPIKitImport.default

const CHAIN_ID = 11155111n; // Sepolia

export const prepareTransactionAction: Action = {
  name: "PREPARE_SAFE_TRANSACTION",
  description: "Prepares a Safe transaction and returns the transaction hash for user signing",
  similes: ["prepare transaction", "create transaction", "setup transaction"],
  examples: [
      [
          {
              user: "{{user}}",
              content: { text: "prepare transaction for ETH yield strategy" },
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
          const userAddress = options?.userAddress as string;
          const safeAddress = options?.safeAddress as string;
          const to = options?.to as string;
          const value = options?.value as string;
          const data = options?.data as string || '0x';
          const operation = options?.operation as number || OperationType.Call;
          const strategyName = options?.strategyName as string || 'Unknown Strategy';
          const strategyDescription = options?.strategyDescription as string || '';

          if (!safeAddress || !to || !value) {
              throw new Error("safeAddress, to, and value are required parameters");
          }

          // Get Nest's private key from environment
          const nestPrivateKey = runtime.getSetting("EVM_PRIVATE_KEY");
          const rpcUrl = runtime.getSetting("EVM_PROVIDER_URL");

          if (!nestPrivateKey || !rpcUrl) {
              throw new Error("Missing EVM_PRIVATE_KEY or EVM_PROVIDER_URL for Nest");
          }

          // Format Nest's private key and derive address
          const formattedPrivateKey = nestPrivateKey.startsWith('0x')
              ? nestPrivateKey
              : `0x${nestPrivateKey}`;
          const nestAccount = privateKeyToAccount(formattedPrivateKey as `0x${string}`);

          // Create a public client
          const publicClient = createPublicClient({
              chain: sepolia,
              transport: http(rpcUrl),
          });

          const safe = await (Safe as any).init({
              provider: rpcUrl,
              signer: formattedPrivateKey,
              safeOptions: {
                owners: [nestAccount.address, userAddress],
                threshold: 2,
              },
              safeAddress: safeAddress,
              isL1SafeSingleton: true,
          });

          const safeTxGas = await publicClient.estimateGas({
            to: to as `0x${string}`,
            value: BigInt(value),
            data: data as `0x${string}`,
          });

          const gasPrice = await publicClient.getGasPrice();

          const nonce = await safe.getNonce(safeAddress);
          console.log('nonce', nonce)
          // Create transaction data
          const safeTransactionData: SafeTransactionDataPartial = {
              to,
              value,
              data,
              operation,
              safeTxGas: safeTxGas.toString(),
              baseGas: '21000', // Minimum base gas
              nonce: nonce,
              gasPrice: gasPrice.toString(),
              gasToken: '0x0000000000000000000000000000000000000000',
              refundReceiver: '0x0000000000000000000000000000000000000000',
          };

          // Create the Safe transaction
          const safeTransaction = await safe.createTransaction({
              transactions: [safeTransactionData]
          });

          console.log("Safe transaction:", safeTransaction);
          // Get transaction hash
          const safeTxHash = await safe.getTransactionHash(safeTransaction);
          console.log('safeTxHash', safeTxHash)

          // Check for existing pending transactions
          const apiKit = new SafeApiKit({
              chainId: CHAIN_ID,
              txServiceUrl: 'https://safe-transaction-sepolia.safe.global/api'
          });

          const pendingTransactions = await apiKit.getPendingTransactions(safeAddress);

          // Check if an identical transaction is already in the pending queue
          const duplicateTx = pendingTransactions.results.find(tx => 
              tx.to.toLowerCase() === to.toLowerCase() &&
              tx.value === value &&
              tx.data === data &&
              !tx.isExecuted &&
              tx.confirmations?.some(conf => 
                  conf.owner.toLowerCase() === nestAccount.address.toLowerCase()
              )
          );

          if (duplicateTx) {
              console.log("duplicateTx found", duplicateTx);
              callback?.({
                text: `Found identical transaction already in queue.
Transaction hash: ${duplicateTx.safeTxHash}`,
                content: {
                    success: true,
                    safeTxHash: duplicateTx.safeTxHash,
                    safeAddress,
                    strategy: {
                        name: strategyName,
                        description: strategyDescription
                    },
                    transaction: {
                        to: duplicateTx.to,
                        value: duplicateTx.value,
                        data: duplicateTx.data,
                        operation: duplicateTx.operation,
                        safeTxHash: duplicateTx.safeTxHash
                    },
                    signatures: {
                        nest: duplicateTx.confirmations.find(conf => 
                            conf.owner.toLowerCase() === nestAccount.address.toLowerCase()
                        )?.signature
                    }
                }
              });
              return true;
          }

          // If no duplicate found, sign and propose the new transaction
          const nestSignature = await safe.signHash(safeTxHash);
          console.log("Nest signature:", nestSignature);

          // Propose the new transaction
          await apiKit.proposeTransaction({
            safeAddress: safeAddress,
            safeTransactionData: safeTransaction.data,
            safeTxHash,
            senderAddress: nestAccount.address,
            senderSignature: nestSignature.data
          })

          const resultMessage = `Transaction prepared for ${strategyName}:
${strategyDescription}

Transaction details:
To: ${to}
Value: ${value} wei
Safe Transaction Hash: ${safeTxHash}

Next steps:
1. Sign the transaction using the Safe Transaction Hash
2. The transaction will be executed once your signature is provided`;

          callback?.({
              text: resultMessage,
              content: {
                  success: true,
                  safeTxHash,
                  safeAddress,
                  strategy: {
                      name: strategyName,
                      description: strategyDescription
                  },
                  transaction: {
                      ...safeTransactionData,
                      safeTxHash
                  },
                  signatures: {
                      nest: nestSignature.data,
                  }
              }
          });

          return true;
      } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          callback?.({
              text: `Error preparing transaction: ${errorMessage}`,
              content: { error: error },
          });
          return false;
      }
  },
};
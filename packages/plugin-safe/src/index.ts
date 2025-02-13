import { type Plugin } from '@elizaos/core';
import { deployNewSafeAction } from './actions/deployNewSafeAction.js';
import { checkSafeAction } from './actions/checkSafeAction.js'; 
import { prepareTransactionAction } from './actions/prepareTransactionAction.js';
import { getPendingTransactionsAction } from './actions/getPendingTransactionsAction.js';
import { executeTransactionAction } from './actions/executeTransactionAction.js';
import { arbitrum } from 'viem/chains';

export const transactionServiceConfig = {
  chainId: BigInt(arbitrum.id),
  txServiceUrl: "https://safe-transaction-arbitrum.safe.global/api",
}

export const safePlugin: Plugin = {
  name: 'Safe Protocol Integration',
  description: 'Plugin for integrating Safe protocol wallet functionality',
  providers: [],
  evaluators: [],
  services: [],
  actions: [
    deployNewSafeAction, 
    checkSafeAction, 
    prepareTransactionAction,
    getPendingTransactionsAction,
    executeTransactionAction
  ]
};

export const pluginSafe = safePlugin;
export default safePlugin;

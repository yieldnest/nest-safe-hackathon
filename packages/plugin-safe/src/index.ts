import { type Plugin } from '@elizaos/core';
import { createSafeAction } from './actions/createSafeAction.js';
import { deployNewSafeAction } from './actions/deployNewSafeAction.js';
import { checkSafeAction } from './actions/checkSafeAction.js'; 
import { prepareTransactionAction } from './actions/prepareTransactionAction.js';
import { getPendingTransactionsAction } from './actions/getPendingTransactionsAction.js';
import { executeTransactionAction } from './actions/executeTransactionAction.js';

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

// src/actions/deployNewSafeAction.ts

import {
    type Action,
    type HandlerCallback,
    type IAgentRuntime,
    type Memory,
    type State,
} from '@elizaos/core';

import Safe, {
    PredictedSafeProps,
    SafeAccountConfig,
    SafeDeploymentConfig,
} from '@safe-global/protocol-kit';

import { sepolia } from 'viem/chains';
import { createPublicClient, createWalletClient, http, formatUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { waitForTransactionReceipt } from 'viem/actions';

export const deployNewSafeAction: Action = {
    name: "DEPLOY_NEW_SAFE_ACCOUNT",
    description: "Deploys a new Safe smart account with both the user and Nest as owners, requiring both signatures for transactions.",
    similes: ["deploy safe", "launch safe account", "execute safe deployment"],
    examples: [
        [
            {
                user: "{{user}}",
                content: { text: "deploy a new safe account" },
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
            // Get Nest's private key from environment
            const nestPrivateKey = runtime.getSetting("EVM_PRIVATE_KEY");
            const rpcUrl = runtime.getSetting("EVM_PROVIDER_URL");
            if (!nestPrivateKey || !rpcUrl) {
                throw new Error("Missing EVM_PRIVATE_KEY or EVM_PROVIDER_URL for Nest");
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

            // Create a public client to fetch and log the account balance
            const publicClient = createPublicClient({
                chain: sepolia,
                transport: http(rpcUrl),
            });

            const balance = await publicClient.getBalance({ 
                address: nestAddress
            });

            const formattedBalance = formatUnits(balance, 18);
            console.log("Nest account balance:", formattedBalance);

            // Configure the Safe account with both owners
            const safeAccountConfig: SafeAccountConfig = {
                owners: [userAddress, nestAddress],
                threshold: 2,
            };

            // Build the predicted safe configuration
            const predictedSafe: PredictedSafeProps = {
                safeAccountConfig,
            };

            console.log("Deploying Safe with config:", {
                owners: safeAccountConfig.owners,
                threshold: safeAccountConfig.threshold,
            });

            // Initialize the Protocol Kit
            const protocolKit = await (Safe as any).init({
              provider: rpcUrl,
                signer: formattedPrivateKey,
                predictedSafe,
                isL1SafeSingleton: true,
            });

            // Create the deployment transaction
            const deploymentTransaction = await protocolKit.createSafeDeploymentTransaction();

            // Get the external signer for deployment
            const externalSigner = await protocolKit.getSafeProvider().getExternalSigner();

            // Execute the deployment transaction
            const txHash = await externalSigner.sendTransaction({
                to: deploymentTransaction.to,
                value: BigInt(deploymentTransaction.value || '0'),
                data: deploymentTransaction.data as `0x${string}`,
                chain: sepolia,
            });

            // Wait for the transaction receipt
            const receipt = await publicClient.waitForTransactionReceipt({
                hash: txHash as `0x${string}`
            });

            // Get the Safe address
            const safeAddress = await protocolKit.getAddress();
            console.log("Safe Deployed: ", safeAddress);

            // Connect to the deployed Safe
            const newProtocolKit = await protocolKit.connect({ safeAddress });
            const isSafeDeployed = await newProtocolKit.isSafeDeployed();
            const deployedSafeAddress = await newProtocolKit.getAddress();
            const safeOwners = await newProtocolKit.getOwners();
            const safeThreshold = await newProtocolKit.getThreshold();

            const resultMessage = `Safe smart account deployed successfully.
Transaction hash: ${txHash}
Safe address: ${deployedSafeAddress}
Is Safe deployed: ${isSafeDeployed}
Owners: ${safeOwners.join(', ')}
Threshold: ${safeThreshold}
Nest balance: ${formattedBalance} ETH`;
            callback?.({
                text: resultMessage,
                content: {
                    safeAddress: deployedSafeAddress,
                    txHash,
                    receipt,
                    safeOwners,
                    safeThreshold: safeThreshold.toString(),
                    balance: formattedBalance,
                },
            });
            return true;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            callback?.({
                text: `Error deploying safe account: ${errorMessage}`,
                content: { error: errorMessage },
            });
            return false;
        }
    },
};

export default deployNewSafeAction;
  
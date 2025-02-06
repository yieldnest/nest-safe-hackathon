import { Provider, IAgentRuntime, Memory, State } from "@elizaos/core";
import Safe, {
    PredictedSafeProps,
    SafeAccountConfig,
    SafeDeploymentConfig
} from '@safe-global/protocol-kit'
import { Account } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { publicClient, createViemWalletClient } from './viem-client'
import { sepolia } from 'viem/chains'

// Required environment variables:
// EVM_PROVIDER_URL=your_ethereum_rpc_url (RPC endpoint for the network)
// EVM_PRIVATE_KEY=nest_wallet_private_key (Nest's private key for signing)

export class SafeWalletManager {
    private safe?: Safe;
    private safeAddress?: string;
    private account?: Account;
    private protocolKit?: Safe;
    private walletClient?: ReturnType<typeof createViemWalletClient>;
    private privateKey?: string;


    async initialize(runtime: IAgentRuntime) {
        console.log("[SafeWalletManager] Initializing...");
        this.privateKey = runtime.getSetting("EVM_PRIVATE_KEY");

        
        if (!this.privateKey) {
            console.error("[SafeWalletManager] Missing EVM_PRIVATE_KEY");
            throw new Error("Missing required setting: EVM_PRIVATE_KEY");
        }

        try {
            console.log("[SafeWalletManager] Setting up account...");
            
            const formattedPrivateKey = this.privateKey.startsWith('0x') ? this.privateKey : `0x${this.privateKey}`;
            this.account = privateKeyToAccount(formattedPrivateKey as `0x${string}`);
            
            this.walletClient = createViemWalletClient(formattedPrivateKey);
            
            console.log("[SafeWalletManager] Successfully derived Nest's address:", this.account.address);

            // Test connection
            try {
                const chainId = await publicClient.getChainId();
                console.log("[SafeWalletManager] Successfully connected to provider, network:", chainId);
            } catch (error) {
                console.error("[SafeWalletManager] Failed to connect to provider:", error);
                throw new Error(`Failed to connect to provider`);
            }

            console.log("[SafeWalletManager] Initialization complete");
        } catch (error) {
            console.error("[SafeWalletManager] Initialization failed:", error);
            throw error;
        }
    }

    async createSafe(ownerAddress: string, nestAddress: string) {
        try {
            console.log("[SafeWalletManager] Starting Safe creation...");
            if (!this.account) {
                throw new Error('Safe wallet not initialized. Call initialize() first.');
            }
            console.log("[SafeWalletManager] Using owners:", ownerAddress, nestAddress);

            // Configure Safe Account
            const safeAccountConfig: SafeAccountConfig = {
                owners: [ownerAddress, nestAddress],
                threshold: 2
            };

            // Create predicted Safe configuration
            const predictedSafe: PredictedSafeProps = {
                safeAccountConfig
            };

            console.log("[SafeWalletManager] Predicted Safe configuration:", predictedSafe);

            this.protocolKit = await Safe.init({
                provider: sepolia.rpcUrls.default.http[0],
                signer: this.privateKey,
                predictedSafe
            });

            // Get the predicted address
            this.safeAddress = await this.protocolKit.getAddress();
            console.log("[SafeWalletManager] Predicted Safe address:", this.safeAddress);

            // Create deployment transaction
            const deploymentTransaction = await this.protocolKit.createSafeDeploymentTransaction();

            // Execute deployment transaction using viem
            // Execute deployment transaction using viem
            const transactionHash = await this.walletClient.
            sendTransaction({
                account: this.account,
                to: deploymentTransaction.to as `0x${string}`,
                value: BigInt(deploymentTransaction.value || '0'),
                data: deploymentTransaction.data as `0x${string}`,
                chain: sepolia,
                kzg: undefined 
            });

            // Wait for transaction to be mined
            const transactionReceipt = await publicClient.waitForTransactionReceipt({
                hash: transactionHash
            });

            // Connect to the deployed Safe
            this.safe = await this.protocolKit.connect({
                safeAddress: this.safeAddress
            });

            const isDeployed = await this.safe.isSafeDeployed();
            console.log("[SafeWalletManager] Safe deployed:", isDeployed);

            // Get Safe info
            const safeOwners = await this.safe.getOwners();
            const safeThreshold = await this.safe.getThreshold();
            console.log("[SafeWalletManager] Safe owners:", safeOwners);
            console.log("[SafeWalletManager] Safe threshold:", safeThreshold);

            return this.safeAddress;
        } catch (error) {
            console.error("[SafeWalletManager] Error creating Safe:", error);
            throw error;
        }
    }

    async loadExistingSafe(safeAddress: string) {
        try {
            if (!this.account || !this.walletClient) {
                throw new Error('Safe wallet not initialized. Call initialize() first.');
            }

            // Initialize Protocol Kit with existing Safe
            this.protocolKit = await Safe.init({
                provider: sepolia.rpcUrls.default.http[0],
                signer: this.privateKey,
                safeAddress
            });

            // Connect to the Safe
            this.safe = await this.protocolKit.connect({
                safeAddress
            });

            this.safeAddress = safeAddress;

            // Get Safe info
            const isDeployed = await this.safe.isSafeDeployed();
            const safeOwners = await this.safe.getOwners();
            const safeThreshold = await this.safe.getThreshold();
            console.log("[SafeWalletManager] Safe deployed:", isDeployed);

            return this.safe;
        } catch (error) {
            console.error('Error loading existing Safe:', error);
            throw error;
        }
    }

    getInfo() {
        return {
            safeAddress: this.safeAddress,
            isInitialized: !!this.safe
        };
    }
}

// Global instance of the Safe wallet manager
const safeManager = new SafeWalletManager();

export const safeWalletProvider: Provider = {
    async get(
        runtime: IAgentRuntime,
        _message: Memory,
        _state?: State
    ): Promise<string | null> {
        try {
            const info = safeManager.getInfo();
            if (!info.safeAddress) {
                return "No Safe wallet has been created yet.";
            }
            return `Safe Wallet Address: ${info.safeAddress}\nStatus: ${info.isInitialized ? 'Initialized' : 'Not Initialized'}`;
        } catch (error) {
            console.error("Error in Safe wallet provider:", error);
            return null;
        }
    }
};

// Export the manager for use in actions
export { safeManager }; 
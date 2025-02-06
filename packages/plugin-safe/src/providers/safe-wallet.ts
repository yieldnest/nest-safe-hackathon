import { Provider, IAgentRuntime, Memory, State } from "@elizaos/core";
import Safe, { EthersAdapter } from '@safe-global/protocol-kit'
import SafeApiKit from '@safe-global/api-kit'
import { ethers } from 'ethers'
import { type SafeTransactionDataPartial } from '@safe-global/safe-core-sdk-types'

// Required environment variables:
// EVM_PROVIDER_URL=your_ethereum_rpc_url (RPC endpoint for the network)
// EVM_PRIVATE_KEY=nest_wallet_private_key (Nest's private key for signing)
// EVM_PUBLIC_KEY=your_wallet_address
// NEST_PUBLIC_KEY=nest_wallet_address

// Constants
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export class SafeWalletManager {
    private safe?: Safe;
    private safeAddress?: string;
    private apiKit?: SafeApiKit;
    private provider?: ethers.providers.JsonRpcProvider;
    private signer?: ethers.Wallet;
    private ethAdapter?: EthersAdapter;

    async initialize(runtime: IAgentRuntime) {
        console.log("[SafeWalletManager] Initializing...");
        const providerUrl = runtime.getSetting("EVM_PROVIDER_URL");
        const privateKey = runtime.getSetting("EVM_PRIVATE_KEY");
        
        if (!providerUrl) {
            console.error("[SafeWalletManager] Missing EVM_PROVIDER_URL");
            throw new Error("Missing required setting: EVM_PROVIDER_URL");
        }
        if (!privateKey) {
            console.error("[SafeWalletManager] Missing EVM_PRIVATE_KEY");
            throw new Error("Missing required setting: EVM_PRIVATE_KEY");
        }

        try {
            console.log("[SafeWalletManager] Setting up ethers provider and signer...");
            
            // Create provider and signer
            this.provider = new ethers.providers.JsonRpcProvider(providerUrl);
            this.signer = new ethers.Wallet(privateKey, this.provider);
            
            const address = await this.signer.getAddress();
            console.log("[SafeWalletManager] Successfully derived Nest's address:", address);

            // Test connection
            try {
                const network = await this.provider.getNetwork();
                console.log("[SafeWalletManager] Successfully connected to provider, network:", network.chainId);
            } catch (error) {
                console.error("[SafeWalletManager] Failed to connect to provider:", error);
                throw new Error(`Failed to connect to provider at ${providerUrl}`);
            }

            // Create ethers adapter
            console.log("[SafeWalletManager] Creating Safe adapter...");
            this.ethAdapter = new EthersAdapter({
                ethers: ethers as any,
                signerOrProvider: this.signer
            });

            console.log("[SafeWalletManager] Initializing Safe API Kit...");
            this.apiKit = new SafeApiKit({
                txServiceUrl: 'https://safe-transaction-sepolia.safe.global',
                ethAdapter: this.ethAdapter
            });

            console.log("[SafeWalletManager] Initialization complete");
        } catch (error) {
            console.error("[SafeWalletManager] Initialization failed:", error);
            throw error;
        }
    }

    async createSafe(ownerAddress: string, nestAddress: string) {
        try {
            console.log("[SafeWalletManager] Starting Safe creation...");
            if (!this.ethAdapter) {
                throw new Error('Safe wallet not initialized. Call initialize() first.');
            }
            console.log("[SafeWalletManager] Using owners:", ownerAddress, nestAddress);

            // Create and deploy new Safe
            const safe = await Safe.create({
                ethAdapter: this.ethAdapter,
                predictedSafe: {
                    safeAccountConfig: {
                        owners: [ownerAddress, nestAddress],
                        threshold: 2
                    }
                }
            });

            console.log("[SafeWalletManager] Safe instance created");

            this.safe = safe;
            this.safeAddress = await safe.getAddress();
            console.log("[SafeWalletManager] Safe deployed at address:", this.safeAddress);

            return this.safeAddress;
        } catch (error) {
            console.error("[SafeWalletManager] Error creating Safe:", error);
            throw error;
        }
    }

    async signTransaction(tx: SafeTransactionDataPartial) {
        if (!this.safe || !this.safeAddress) {
            throw new Error('No Safe initialized');
        }

        try {
            // Create and sign transaction
            const safeTransaction = await this.safe.createTransaction({ safeTransactionData: tx });
            const safeTxHash = await this.safe.getTransactionHash(safeTransaction);
            const signature = await this.safe.signTransactionHash(safeTxHash);

            // Propose transaction to the Safe Transaction Service
            if (this.apiKit) {
                await this.apiKit.proposeTransaction({
                    safeAddress: this.safeAddress,
                    safeTransactionData: {
                        ...tx,
                        operation: tx.operation || 0, // Default to Call operation if not specified
                        safeTxGas: tx.safeTxGas || '0',
                        baseGas: tx.baseGas || '0',
                        gasPrice: tx.gasPrice || '0',
                        gasToken: tx.gasToken || ZERO_ADDRESS,
                        refundReceiver: tx.refundReceiver || ZERO_ADDRESS,
                        nonce: tx.nonce || await this.safe.getNonce()
                    },
                    safeTxHash,
                    senderSignature: signature.data,
                    senderAddress: await this.safe.getAddress()
                });
            }

            return signature;
        } catch (error) {
            console.error('Error signing transaction:', error);
            throw error;
        }
    }

    async loadExistingSafe(safeAddress: string) {
        try {
            if (!this.ethAdapter) {
                throw new Error('Safe wallet not initialized. Call initialize() first.');
            }

            // Initialize existing Safe
            const safe = await Safe.create({
                ethAdapter: this.ethAdapter,
                safeAddress
            });

            this.safe = safe;
            this.safeAddress = safeAddress;
            return safe;
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
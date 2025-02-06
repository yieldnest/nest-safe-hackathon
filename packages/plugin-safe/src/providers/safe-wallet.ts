import { Provider, IAgentRuntime, Memory, State } from "@elizaos/core";
import Safe from '@safe-global/protocol-kit'
import { EthersAdapter } from '@safe-global/protocol-kit'
import SafeApiKit from '@safe-global/api-kit'
import { ethers } from 'ethers'
import { type SafeTransactionDataPartial } from '@safe-global/safe-core-sdk-types'
import { type SafeAccountConfig } from '@safe-global/protocol-kit'

// EVM_PROVIDER_URL=your_ethereum_rpc_url
// EVM_PRIVATE_KEY=your_private_key
// EVM_PUBLIC_KEY=your_wallet_address
// NEST_PUBLIC_KEY=nest_wallet_address

export class SafeWalletManager {
    private safe?: Safe;
    private safeAddress?: string;
    private apiKit?: SafeApiKit;
    private ethAdapter?: EthersAdapter;

    async initialize(runtime: IAgentRuntime) {
        const providerUrl = runtime.getSetting("EVM_PROVIDER_URL");
        const privateKey = runtime.getSetting("EVM_PRIVATE_KEY");
        
        if (!providerUrl || !privateKey) {
            throw new Error("Missing required settings: EVM_PROVIDER_URL or EVM_PRIVATE_KEY");
        }

        const provider = new ethers.JsonRpcProvider(providerUrl);
        const signer = new ethers.Wallet(privateKey, provider);
        
        // Create ethers adapter
        this.ethAdapter = new EthersAdapter({
            ethers,
            signerOrProvider: signer
        });

        // Initialize API Kit for the Sepolia testnet
        this.apiKit = new SafeApiKit({
            txServiceUrl: 'https://safe-transaction-sepolia.safe.global',
            ethAdapter: this.ethAdapter
        });
    }

    async createSafe(ownerAddress: string, nestAddress: string) {
        try {
            if (!this.ethAdapter) {
                throw new Error('Safe wallet not initialized. Call initialize() first.');
            }

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

            this.safe = safe;
            this.safeAddress = await safe.getAddress();

            return this.safeAddress;
        } catch (error) {
            console.error('Error creating Safe:', error);
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
                        gasToken: tx.gasToken || ethers.ZeroAddress,
                        refundReceiver: tx.refundReceiver || ethers.ZeroAddress,
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
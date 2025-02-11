import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import { useDefaultAgent } from "@/hooks/use-default-agent";
import { useAccount, useSignTypedData } from "wagmi";
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface Strategy {
    name: string;
    description: string;
    to: string;
    value: string;
    data?: string;
}

const DUMMY_STRATEGIES: Strategy[] = [
    {
        name: "Strategy 1",
        description: "Transfer 0.1 ETH to test address",
        to: "0xAdAeEC335FA4c13Fae6eD125F5521FEED489FDC5",
        value: "100000000000000000" // 0.1 ETH in wei
    },
    {
        name: "Strategy 2",
        description: "Transfer 0.2 ETH to test address",
        to: "0xAdAeEC335FA4c13Fae6eD125F5521FEED489FDC5",
        value: "200000000000000000", // 0.2 ETH in wei
        data: "0x"
    },
    {
        name: "Strategy 3",
        description: "Transfer 0.3 ETH to test address",
        to: "0xAdAeEC335FA4c13Fae6eD125F5521FEED489FDC5",
        value: "300000000000000000" // 0.3 ETH in wei
    }
];

export function StrategyCard() {
    const { address, isConnected } = useAccount();
    const { agent } = useDefaultAgent();
    const { toast } = useToast();
    const { signTypedDataAsync } = useSignTypedData();
    const [loading, setLoading] = useState<{[key: string]: boolean}>({});

    const handlePrepareAndSign = async (strategy: Strategy) => {
        if (!isConnected || !address) {
            toast({
                title: "Wallet not connected",
                description: "Please connect your wallet first.",
                variant: "destructive",
            });
            return;
        }

        if (!agent?.id) {
            toast({
                title: "Error",
                description: "Agent not found",
                variant: "destructive",
            });
            return;
        }

        try {
            setLoading(prev => ({ ...prev, [strategy.name]: true }));

            // First, check if we have a Safe
            const safeResponse = await apiClient.executeAction("CHECK_SAFE_ACCOUNT", {
                ownerAddress: address
            }, agent.id);

            if (!safeResponse.content?.content?.isSafeDeployed) {
                throw new Error("No Safe account found. Please create one first.");
            }

            const safeAddress = safeResponse.content.content.safeAddress;
            console.log("Safe address:", safeAddress);

            // Check for pending transactions first
            const pendingTxResponse = await apiClient.executeAction("GET_PENDING_TRANSACTIONS", {
                safeAddress
            }, agent.id);

            // Get pending transactions and Nest's address - note the extra .content nesting
            const pendingTx = pendingTxResponse.content?.content?.transactions?.[0];
            const nestAddress = pendingTxResponse.content?.content?.nestAddress;

            let txToSign;

            // check pendingTx is not executed
            if (pendingTx && !pendingTx.isExecuted) {
                // Check if this transaction matches our strategy
                const toMatches = pendingTx.to.toLowerCase() === strategy.to.toLowerCase();
                const valueMatches = pendingTx.value === strategy.value;

                console.log("Transaction matching:", {
                    toMatches,
                    valueMatches,
                    pendingTxTo: pendingTx.to.toLowerCase(),
                    strategyTo: strategy.to.toLowerCase(),
                    pendingTxValue: pendingTx.value,
                    strategyValue: strategy.value
                });

                if (toMatches && valueMatches) {
                    console.log("Found matching transaction:", pendingTx);
                    // Check if Nest has signed it
                    const nestConfirmation = pendingTx.confirmations?.find((conf: { owner: string; signature: string }) => 
                        conf.owner.toLowerCase() === nestAddress?.toLowerCase()
                    );
                    const userConfirmation = pendingTx.confirmations?.find((conf: { owner: string; signature: string }) => 
                        conf.owner.toLowerCase() === address?.toLowerCase()
                    );
                    console.log('userConfirmation', userConfirmation)
                    console.log('pendingTx', pendingTx)
                    if (nestConfirmation && !userConfirmation) {
                        console.log("Found Nest's signature:", nestConfirmation);
                        txToSign = {
                            to: pendingTx.to,
                            value: pendingTx.value,
                            data: pendingTx.data || '0x',
                            operation: pendingTx.operation,
                            safeTxGas: pendingTx.safeTxGas,
                            baseGas: pendingTx.baseGas,
                            gasPrice: pendingTx.gasPrice,
                            gasToken: pendingTx.gasToken,
                            refundReceiver: pendingTx.refundReceiver,
                            nonce: pendingTx.nonce,
                            safeTxHash: pendingTx.safeTxHash
                        };
                    }
                    if (userConfirmation) {
                        console.log("User has already signed this transaction");
                    }
                }
                console.log("Requesting signature for transaction:", txToSign);
                
                if (txToSign) {
                    const signature = await signTypedDataAsync({
                        domain: {
                            chainId: 11155111, // Sepolia
                            verifyingContract: safeAddress,
                        },
                        types: {
                            SafeTx: [
                                { name: "to", type: "address" },
                                { name: "value", type: "uint256" },
                                { name: "data", type: "bytes" },
                                { name: "operation", type: "uint8" },
                                { name: "safeTxGas", type: "uint256" },
                                { name: "baseGas", type: "uint256" },
                                { name: "gasPrice", type: "uint256" },
                                { name: "gasToken", type: "address" },
                                { name: "refundReceiver", type: "address" },
                                { name: "nonce", type: "uint256" },
                            ],
                        },
                        primaryType: "SafeTx",
                        message: txToSign,
                    });
                    console.log("User signature:", signature);
                    const response = await fetch(
                        `https://safe-transaction-sepolia.safe.global/api/v1/multisig-transactions/${txToSign.safeTxHash}/confirmations/`,
                        {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                signature,
                                owner: address
                            }),
                        }
                    ); 
                    if (!response.ok) {
                        throw new Error('Failed to submit signature to Safe Transaction Service');
                    }
                }

                // Submit the signature to Safe Transaction Service
                toast({
                    title: "Transaction Signed",
                    description: "Transaction has been signed and will be executed shortly.",
                });
                await apiClient.executeAction("EXECUTE_SAFE_TRANSACTION", {
                    safeAddress
                }, agent.id);
            }

            // If no matching pending transaction, prepare a new one
            console.log("Preparing new transaction with params:", {
                safeAddress,
                to: strategy.to,
                value: strategy.value,
                data: strategy.data || '0x',
                strategyName: strategy.name,
                strategyDescription: strategy.description,
                userAddress: address // Add userAddress parameter
            });

            const prepareResponse = await apiClient.executeAction("PREPARE_SAFE_TRANSACTION", {
                safeAddress,
                to: strategy.to,
                value: strategy.value,
                data: strategy.data || '0x',
                strategyName: strategy.name,
                strategyDescription: strategy.description,
                userAddress: address // Add userAddress which is required by prepareTransactionAction
            }, agent.id);

            console.log("Prepare response:", prepareResponse);

            if (!prepareResponse?.content?.content?.safeTxHash) {
                console.error("Invalid prepare response:", prepareResponse);
                throw new Error("Failed to prepare transaction - missing safeTxHash");
            }

            const safeTxHash = prepareResponse.content.content.safeTxHash;
            const txToSignNew = prepareResponse.content.content.transaction;

            console.log("Transaction to sign:", txToSignNew);

            // Request user signature
            const signatureNew = await signTypedDataAsync({
                domain: {
                    chainId: 11155111, // Sepolia
                    verifyingContract: safeAddress,
                },
                types: {
                    SafeTx: [
                        { name: "to", type: "address" },
                        { name: "value", type: "uint256" },
                        { name: "data", type: "bytes" },
                        { name: "operation", type: "uint8" },
                        { name: "safeTxGas", type: "uint256" },
                        { name: "baseGas", type: "uint256" },
                        { name: "gasPrice", type: "uint256" },
                        { name: "gasToken", type: "address" },
                        { name: "refundReceiver", type: "address" },
                        { name: "nonce", type: "uint256" },
                    ],
                },
                primaryType: "SafeTx",
                message: txToSignNew,
            });

            console.log("User signature:", signatureNew);

            // Submit user's signature to Safe Transaction Service
            const responseNew = await fetch(
                `https://safe-transaction-sepolia.safe.global/api/v1/multisig-transactions/${safeTxHash}/confirmations/`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        signature: signatureNew,
                        owner: address
                    }),
                }
            );

            if (!responseNew.ok) {
                throw new Error('Failed to submit signature to Safe Transaction Service');
            }

            toast({
                title: "Transaction Signed",
                description: "Transaction has been signed and will be executed shortly.",
            });

            // Execute the transaction
            await apiClient.executeAction("EXECUTE_SAFE_TRANSACTION", {
                safeAddress
            }, agent.id);
        } catch (error) {
            console.error("Error:", error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to process transaction",
                variant: "destructive",
            });
        } finally {
            setLoading(prev => ({ ...prev, [strategy.name]: false }));
        }
    };

    return (
        <div className="flex flex-col w-full h-[calc(100dvh-4.5rem)] p-4">
            <div className="grid grid-cols-3 gap-4">
                {DUMMY_STRATEGIES.map((strategy) => (
                    <Card key={strategy.name}>
                        <CardContent className="flex flex-col gap-4 p-6">
                            <div className="space-y-2">
                                <h3 className="text-lg font-medium">
                                    {strategy.name}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {strategy.description}
                                </p>
                            </div>
                            <Button
                                onClick={() => handlePrepareAndSign(strategy)}
                                disabled={loading[strategy.name]}
                            >
                                {loading[strategy.name] ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    "Test Transaction"
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
} 
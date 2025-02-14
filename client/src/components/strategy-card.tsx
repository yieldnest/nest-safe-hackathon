import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCheckPendingTransaction } from "@/hooks/use-check-pending-transaction";
import { useDefaultAgent } from "@/hooks/use-default-agent";
import { useSafeDetails } from "@/hooks/use-safe-details";
import { useSignAndExecute } from "@/hooks/use-sign-and-execute";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { arbitrum } from "viem/chains";
import { useAccount } from "wagmi";

interface Strategy {
    name: string;
    description: string;
    to: string;
    value: string;
    data?: string;
    tokenIn: string;
    tokenOut: string;
    amountIn: string;
}

export function StrategyCard({ strategy }: { strategy: Strategy }) {
    const { address, isConnected } = useAccount();
    const { safeDetails } = useSafeDetails();
    const { agent } = useDefaultAgent();
    const { toast } = useToast();
    const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
    const { signAndExecute } = useSignAndExecute();
    const { checkPendingTransaction } = useCheckPendingTransaction();

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
        if (!safeDetails?.address) {
            toast({
                title: "Error",
                description: "Safe address not found",
                variant: "destructive",
            });
            return;
        }
        try {
            setLoading((prev) => ({ ...prev, [strategy.name]: true }));

            // Call the route swap action for the first strategy
            const swapResponseData = await apiClient.executeAction(
                "ROUTE_SWAP",
                {
                    fromAddress: safeDetails?.address,
                    receiver: safeDetails?.address,
                    tokenIn: strategy.tokenIn,
                    tokenOut: strategy.tokenOut,
                    amountIn: strategy.amountIn,
                    chainId: arbitrum.id,
                },
                agent.id
            );
            const swapResponse = swapResponseData.content.content;

            const pendingTxResponseData = await apiClient.executeAction(
                "GET_PENDING_TRANSACTIONS",
                {
                    safeAddress: safeDetails?.address,
                },
                agent.id
            );
            let pendingTxResponse = pendingTxResponseData.content.content;

            const txToSign = await checkPendingTransaction(
                pendingTxResponse,
                swapResponse
            );

            if (txToSign) {
                console.log("Requesting signature for transaction:", txToSign);
                await signAndExecute(
                    txToSign,
                    safeDetails?.address as `0x${string}`,
                    address
                );
            } else {
                console.log("Preparing safe transaction with params:", {
                    safeAddress: safeDetails?.address,
                    to: swapResponse.data.tx.to,
                    value: swapResponse.data.tx.value,
                    data: swapResponse.data.tx.data,
                    gas: swapResponse.data.gas,
                    chainId: arbitrum.id,
                });

                const prepareResponseData = await apiClient.executeAction(
                    "PREPARE_SAFE_TRANSACTION",
                    {
                        safeAddress: safeDetails?.address,
                        to: swapResponse.data.tx.to,
                        value: swapResponse.data.tx.value,
                        data: swapResponse.data.tx.data,
                        gas: swapResponse.data.gas,
                        operation: swapResponse.data.tx.operationType,
                        chainId: arbitrum.id,
                    },
                    agent.id
                );
                const prepareResponse = prepareResponseData.content.content;

                console.log("Prepare response:", prepareResponse);

                if (!prepareResponse?.success) {
                    throw new Error("Failed to prepare safe transaction");
                }

                // const pendingTxResponseData = await apiClient.executeAction("GET_PENDING_TRANSACTIONS", {
                //     safeAddress: safeDetails?.address
                // }, agent.id);
                // pendingTxResponse = pendingTxResponseData.content.content;

                // const txToSign = await checkPendingTransaction(pendingTxResponse, swapResponse);

                const txToSign = {
                    to: prepareResponse.transaction.to,
                    value: prepareResponse.transaction.value,
                    data: prepareResponse.transaction.data || "0x",
                    operation: prepareResponse.transaction.operation,
                    safeTxGas: prepareResponse.transaction.safeTxGas,
                    baseGas: prepareResponse.transaction.baseGas,
                    gasPrice: prepareResponse.transaction.gasPrice,
                    gasToken: prepareResponse.transaction.gasToken,
                    refundReceiver: prepareResponse.transaction.refundReceiver,
                    nonce: prepareResponse.transaction.nonce,
                    safeTxHash: prepareResponse.transaction.safeTxHash,
                };

                const nestSignature = prepareResponse.signatures.nest;
                console.log("Requesting signature for transaction:", txToSign);
                await signAndExecute(
                    txToSign,
                    safeDetails?.address as `0x${string}`,
                    nestSignature
                );

                // await apiClient.executeAction("EXECUTE_SAFE_TRANSACTION", {
                //     safeAddress: safeDetails?.address
                // }, agent.id);
            }
        } catch (error) {
            console.error("Error:", error);
            toast({
                title: "Error",
                description:
                    error instanceof Error
                        ? error.message
                        : "Failed to process transaction",
                variant: "destructive",
            });
        } finally {
            setLoading((prev) => ({ ...prev, [strategy.name]: false }));
        }
    };

    return (
        <div className="p-4">
            <Card key={strategy.name}>
                <CardContent className="flex flex-col gap-4 p-6">
                    <div className="space-y-2">
                        <h3 className="text-lg font-medium">{strategy.name}</h3>
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
        </div>
    );
}

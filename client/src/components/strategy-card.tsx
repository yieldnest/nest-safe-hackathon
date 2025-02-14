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
    data: string;
    to: string;
    from: string;
    value: string;
    operationType: number;
    gas: string;
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
        console.log("Strategy:", strategy);
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
            setLoading((prev) => ({ ...prev, [strategy.from]: true }));

            console.log("Preparing safe transaction with params:", {
                safeAddress: strategy.from,
                to: strategy.to,
                value: strategy.value,
                data: strategy.data,
                gas: strategy.gas,
                chainId: arbitrum.id,
            });

            const prepareResponseData = await apiClient.executeAction(
                "SIGN_TRANSACTION",
                {
                    userAddress: address,
                    safeAddress: strategy.from,
                    to: strategy.to,
                    value: strategy.value,
                    data: strategy.data,
                    gas: strategy.gas,
                    operation: strategy.operationType,
                    chainId: arbitrum.id,
                },
                agent.id
            );

            const prepareResponse = prepareResponseData.content.content;

            if (!prepareResponse?.success) {
                throw new Error("Failed to prepare safe transaction");
            }

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
        } catch (error) {
            console.error("Error in preparing and signing transaction:", error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to process transaction",
                variant: "destructive",
            });
        } finally {
            setLoading((prev) => ({ ...prev, [strategy.from]: false }));
        }
    };

    return (
        <div className="p-4 ml-6 bg-nest rounded-sm">
            <Button
                onClick={() => handlePrepareAndSign(strategy)}
                disabled={loading[strategy.from]}
                className="bg-nest-gold"
            >
                {loading[strategy.from] ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                    </>
                ) : (
                    "Execute Transaction"
                )}
            </Button>
        </div>
    );
}

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAccount } from "wagmi";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import { useParams } from "react-router-dom";
import type { UUID } from "@elizaos/core";

export function CreateSafeCard() {
    const { address, isConnected } = useAccount();
    const { toast } = useToast();
    const { agentId } = useParams<{ agentId: UUID }>();

    const handleCreateSafe = async () => {
        if (!isConnected || !address) {
            toast({
                title: "Wallet not connected",
                description: "Please connect your wallet first to create a Safe.",
                variant: "destructive",
            });
            return;
        }

        if (!agentId) {
            toast({
                title: "Error",
                description: "Agent ID is required",
                variant: "destructive",
            });
            return;
        }

        try {
            // Call the DEPLOY_NEW_SAFE_ACCOUNT action through the API
            const response = await apiClient.executeAction("DEPLOY_NEW_SAFE_ACCOUNT", {
                ownerAddress: address,
            }, agentId);

            if (response.success) {
                toast({
                    title: "Safe Created!",
                    description: `Your Safe wallet has been created at ${response.content?.safeAddress || response.safeAddress}`,
                });
            } else {
                throw new Error(response.error || "Failed to create Safe");
            }
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to create Safe",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="flex flex-col w-full h-[calc(100dvh-4.5rem)] p-4">
            <Card className="w-full">
                <CardContent className="flex items-center justify-between p-6">
                    <div className="space-y-2">
                        <h3 className="text-lg font-medium">
                            Create a Safe wallet with Nest
                        </h3>
                        {!isConnected && (
                            <p className="text-sm text-muted-foreground">
                                Connect your wallet first to create a Safe
                            </p>
                        )}
                        {isConnected && (
                            <p className="text-sm text-muted-foreground">
                                Connected wallet: {address}
                            </p>
                        )}
                    </div>
                    <Button
                        onClick={handleCreateSafe}
                        disabled={!isConnected}
                    >
                        Create Safe
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
} 
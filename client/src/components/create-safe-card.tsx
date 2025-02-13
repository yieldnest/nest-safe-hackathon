import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAccount } from "wagmi";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import { useDefaultAgent } from "@/hooks/use-default-agent";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useSafeDetails } from "@/hooks/use-safe-details";

export function CreateSafeCard() {
    const { address, isConnected } = useAccount();
    const { agent } = useDefaultAgent();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const { refetch: refetchSafeDetails } = useSafeDetails();

    const handleCreateSafe = async () => {
        if (!isConnected || !address) {
            toast({
                title: "Wallet not connected",
                description: "Please connect your wallet first to create a Safe.",
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
            setIsLoading(true);
            // Call the DEPLOY_NEW_SAFE_ACCOUNT action through the API
            const response = await apiClient.executeAction("DEPLOY_NEW_SAFE_ACCOUNT", {
                ownerAddress: address,
            }, agent.id);

            if (response.success) {
                toast({
                    title: "Safe Created!",
                    description: `Your Safe wallet has been created at ${response.content?.safeAddress || response.safeAddress}`,
                });
                // Refetch safe details to update the component
                refetchSafeDetails();
            } else {
                throw new Error(response.error || "Failed to create Safe");
            }
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to create Safe",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
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
                        disabled={!isConnected || isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating Safe...
                            </>
                        ) : (
                            "Create Safe"
                        )}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
} 
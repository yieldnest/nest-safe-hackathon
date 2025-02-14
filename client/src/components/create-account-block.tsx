import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAccount } from "wagmi";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import { useDefaultAgent } from "@/hooks/use-default-agent";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useSafeDetails } from "@/hooks/use-safe-details";

export function CreateAccountBlock() {
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
        <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="mb-6">
                <Wallet className="h-12 w-12 text-nest-gold" />
            </div>
            <Button 
                className="text-2xl text-white font-medium mb-3" 
                onClick={handleCreateSafe}
                disabled={!isConnected || isLoading}
            >
                {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                    </>
                ) : (
                    "Create Account"
                )}
            </Button>
            <p className="text-gray-400 text-sm text-center mb-8">
                After you create your account, you can start to access your tokens here.
            </p>
        </div>
    );
} 
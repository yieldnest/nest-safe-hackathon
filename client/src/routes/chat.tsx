import { useParams } from "react-router";
import type { UUID } from "@elizaos/core";
import { CreateSafeCard } from "@/components/create-safe-card";
import Chat from "@/components/chat";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function AgentRoute() {
    const { agentId } = useParams<{ agentId: UUID }>();
    const { address, isConnected } = useAccount();
    const [hasSafe, setHasSafe] = useState<boolean>(false);
    const [safeAddress, setSafeAddress] = useState<string | undefined>();
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const { toast } = useToast();

    useEffect(() => {
        const checkExistingSafe = async () => {
            if (!agentId || !isConnected || !address) {
                setIsLoading(false);
                return;
            }

            try {
                const response = await apiClient.executeAction("CHECK_SAFE_ACCOUNT", {
                    ownerAddress: address
                }, agentId);

                console.log("Check Safe Response:", response);
                console.log('isSafeDeployed', response.content?.content?.isSafeDeployed);
                
                if (response.content?.content?.isSafeDeployed) {
                    console.log('safe deployed');
                    setHasSafe(true);
                    setSafeAddress(response.content.content.safeAddress);
                    console.log("Safe found:", {
                        address: response.content.content.safeAddress,
                        owners: response.content.content.safeOwners,
                        threshold: response.content.content.safeThreshold
                    });
                } else {
                    setHasSafe(false);
                    setSafeAddress(undefined);
                }
            } catch (error) {
                console.error("Error checking Safe:", error);
                toast({
                    title: "Error",
                    description: "Failed to check Safe status",
                    variant: "destructive",
                });
                setHasSafe(false);
                setSafeAddress(undefined);
            } finally {
                setIsLoading(false);
            }
        };

        checkExistingSafe();
    }, [agentId, address, isConnected]);

    if (!agentId) return <div>No data.</div>;
    if (isLoading) return <div>Loading...</div>;

    if (!hasSafe) {
        return <CreateSafeCard />;
    }

    return (
        <>
            {safeAddress && (
                <div className="w-full px-4 py-2 bg-muted/40">
                    <p className="text-sm text-muted-foreground">
                        Safe Account: {safeAddress}
                    </p>
                </div>
            )}
            <Chat agentId={agentId} />
        </>
    );
}

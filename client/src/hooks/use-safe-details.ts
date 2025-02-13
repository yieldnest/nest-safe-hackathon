import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useDefaultAgent } from "@/hooks/use-default-agent";
import { useAccount } from "wagmi";

interface SafeDetails {
    address: string;
    owners: string[];
    threshold: number;
}

export const useSafeDetails = () => {
    const { address, isConnected } = useAccount();
    const { agent } = useDefaultAgent();
    const [safeDetails, setSafeDetails] = useState<SafeDetails | undefined>();
    const { toast } = useToast();

    const checkExistingSafe = async () => {
        if (!agent?.id || !isConnected || !address) {
            setSafeDetails(undefined);
            return;
        }

        try {
            const response = await apiClient.executeAction("CHECK_SAFE_ACCOUNT", {
                ownerAddress: address
            }, agent.id);
            
            if (response.content?.content?.isSafeDeployed) {
                setSafeDetails({
                    address: response.content.content.safeAddress,
                    owners: response.content.content.safeOwners,
                    threshold: response.content.content.safeThreshold
                });
            } else {
                setSafeDetails(undefined);
            }
        } catch (error) {
            console.error("Error checking Safe:", error);
            toast({
                title: "Error",
                description: "Failed to check Safe status",
                variant: "destructive",
            });
            setSafeDetails(undefined);
        }
    };

    useEffect(() => {
        checkExistingSafe();
    }, [agent?.id, address, isConnected]);

    const refetch = () => {
        checkExistingSafe();
    };

    return { safeDetails, refetch };
};
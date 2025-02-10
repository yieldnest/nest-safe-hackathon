import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

export function useDefaultAgent() {
    const query = useQuery({
        queryKey: ["agents"],
        queryFn: () => apiClient.getAgents(),
        select: (data) => data.agents[0], // Get the first (and only) agent
        refetchInterval: 5_000,
    });

    return {
        agent: query.data,
        isLoading: query.isPending,
        error: query.error,
    };
} 
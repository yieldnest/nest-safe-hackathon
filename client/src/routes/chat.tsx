import { CreateSafeCard } from "@/components/create-safe-card";
import Chat from "@/components/chat";
import { useAccount } from "wagmi";
import { useDefaultAgent } from "@/hooks/use-default-agent";
import { useSafeDetails } from "@/hooks/use-safe-details";

export default function ChatRoute() {
    const { isConnected } = useAccount();
    const { agent, isLoading: isLoadingAgent } = useDefaultAgent();
    const safeDetails = useSafeDetails();

    if (isLoadingAgent) return <div>Loading...</div>;
    if (!agent) return <div>No agent found.</div>;

    if (!isConnected) {
        return <CreateSafeCard />;
    }

    if (!safeDetails) {
        return <CreateSafeCard />;
    }

    return <Chat agentId={agent.id} />;
}

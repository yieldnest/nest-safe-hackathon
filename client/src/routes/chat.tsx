import { useParams } from "react-router";
import type { UUID } from "@elizaos/core";
import { CreateSafeCard } from "@/components/create-safe-card";

export default function AgentRoute() {
    const { agentId } = useParams<{ agentId: UUID }>();

    if (!agentId) return <div>No data.</div>;

    // return <Chat agentId={agentId} />;
    return <CreateSafeCard />;
}

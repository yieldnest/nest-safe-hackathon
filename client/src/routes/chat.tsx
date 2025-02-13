import { CreateSafeCard } from "@/components/create-safe-card";
import Chat from "@/components/chat";
import { useAccount } from "wagmi";
import { useDefaultAgent } from "@/hooks/use-default-agent";
import { useSafeDetails } from "@/hooks/use-safe-details";
import { StrategyCard } from "@/components/strategy-card";
import { DUMMY_STRATEGIES } from "./dummystrategies";

export default function ChatRoute() {
    const { isConnected } = useAccount();
    const { agent, isLoading: isLoadingAgent } = useDefaultAgent();
    const { safeDetails } = useSafeDetails();

    if (isLoadingAgent) return <div>Loading...</div>;
    if (!agent) return <div>No agent found.</div>;

    if (!isConnected) {
        return <CreateSafeCard />;
    }

    if (!safeDetails) {
        return <CreateSafeCard />;
    }

    // return (
    //     <>
    //         { safeDetails && safeDetails.address ?
    //             <div className="flex flex-row gap-4">
    //                 {DUMMY_STRATEGIES.map((strategy: any, index: number) => (
    //                     <StrategyCard key={index} strategy={strategy} />
    //                 ))}
    //             </div> 
    //             : 
    //             <CreateSafeCard />
    //         }
    //     </>
    // );

    return <Chat agentId={agent.id} />;
}

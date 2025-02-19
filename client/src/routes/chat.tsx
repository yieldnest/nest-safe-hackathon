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

    // return (
    //     <div className="flex flex-col gap-4 w-1/3 mt-3">
    //         <StrategyCard strategy={DUMMY_STRATEGIES[0]} />
    //     </div>
    // );

    return <Chat agentId={agent?.id} />;
}

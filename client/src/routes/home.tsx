import { GradientButton } from "@/components/ui/gradient-button";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";

export default function Home() {

    const { openConnectModal } = useConnectModal();
    const { isConnected } = useAccount();

    return (
        <div className="
            flex flex-col items-center mx-5 my-3 rounded-lg 
            bg-[radial-gradient(50%_50%_at_50%_50%,#245D12_0%,#093100_100%)] 
            border border-nest-green h-full max-h-[calc(100vh-24px)] relative
        ">
            <img src='/objects.png' className="absolute top-[calc(50%+1.8rem)] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] h-[60%]" />
            <div className="flex flex-col w-full items-center text-center mt-4 z-10">
                <h1 className="text-nest-gold text-7xl/[58px] font-vt323">NEST AI</h1>
                <p className="text-white text-5xl/[36px] font-vt323">
                    AUTONOMOUS 
                    <br />
                    DEFI AI AGENT
                </p>
            </div>
            <img src='/nest-with-pills.png' className="w-[320px] h-[320px] -mt-11 z-20" />
            <div className="flex flex-col items-center text-center z-30">
                <p className="text-white text-base font-bold">
                    Welcome to the Nest.
                </p>
                <span className="text-[15px]/[22.5px]">
                    This is where DeFi meets financial advisor. I’m here to help you make better
                    <br />
                    financial decisions in DeFi. Before we begin, I need you to do 3 things:
                </span>
                <span className="text-[15px]/[22.5px]">
                    1. Connect your Web3 wallet
                    <br />
                    2. Create or connect your Nest wallet
                    <br />
                    3. Start to chat with Nest AI Agent!
                </span>
            </div>
            {!isConnected && (
                <GradientButton className="mt-4" onClick={openConnectModal}>
                    Connect Wallet
                </GradientButton>
            )}
        </div>
    );
}

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
} from "@/components/ui/sidebar";
import { useAccount } from "wagmi";
import { useSafeDetails } from "@/hooks/use-safe-details";
import { FundSafe } from './fund-safe.tsx';
import { ConnectWalletBlock } from './connect-wallet-block';
import { CreateAccountBlock } from './create-account-block';
import { NestHeaderActions } from './nest-header-actions';
import { SafeTokensList } from "./safe-tokens-list"

export function NestSidebar() {
    const { safeDetails } = useSafeDetails();
    const { isConnected } = useAccount();
    const isAccountCreated = true;

    const renderContent = () => {
        if (isConnected) {
            if (isAccountCreated) {
                return (
                    <div className="flex flex-col justify-between">
                        <SafeTokensList />
                    </div>
                );
            }

            return <CreateAccountBlock />;
        }

        return <ConnectWalletBlock />;
    };

    return (
        <Sidebar side="right" width="470px" className="bg-nest m-3 h-[calc(100svh-1.5rem)] rounded-sm border border-nest-light">
            <SidebarHeader className="py-5 px-3.5">
                <span className="text-xl font-medium">
                    Nest AI Account
                </span>
                <NestHeaderActions />
                <div className="border-b border-nest-light mt-2"/>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {renderContent()}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            {isConnected && (
                <SidebarFooter className="flex justify-center items-center flex-col w-full">
                    <img src='/nest-full.png' className="w-48 h-48" />
                    <FundSafe safeAddress={safeDetails?.address} />
                </SidebarFooter>
            )}
        </Sidebar>
    );
}
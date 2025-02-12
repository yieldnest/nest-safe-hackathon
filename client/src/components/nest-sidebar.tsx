import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
} from "@/components/ui/sidebar";
import { useSafeDetails } from "@/hooks/use-safe-details";
import { FundSafe } from './fund-safe.tsx';
import { SafeDetails } from './safe-details.tsx';
import { ConnectWalletBlock } from './connect-wallet-block';
import { CreateAccountBlock } from './create-account-block';
import { NestHeaderActions } from './nest-header-actions';
import { useAccount } from "wagmi";

export function NestSidebar() {
    const safeDetails = useSafeDetails();
    const { isConnected } = useAccount();

    const renderContent = () => {
        if (safeDetails) {
            return (
                <>
                    <SafeDetails safeDetails={safeDetails} />
                    <hr className="my-4 border-t border-200" />
                    <FundSafe safeAddress={safeDetails.address} />
                </>
            );
        }

        if (isConnected) {
            return <CreateAccountBlock />;
        }

        return <ConnectWalletBlock />;
    };

    return (
        <Sidebar side="right" width="24rem" className="bg-nest m-3 h-[calc(100svh-1.5rem)] rounded-sm border border-nest-light">
            <SidebarHeader className="py-5 px-3.5">
                <span className="text-xl font-medium">
                    Nest Accounts
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
        </Sidebar>
    );
}
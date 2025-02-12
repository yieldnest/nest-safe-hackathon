import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NavLink } from "react-router";
import { ConnectButton } from "./ConnectButton";
import { useSafeDetails } from "@/hooks/use-safe-details";
import { FundSafe } from './fund-safe.tsx';
import { SafeDetails } from './safe-details.tsx';

export function NestSidebar() {
    const safeDetails = useSafeDetails();

    return (
        <Sidebar side="right" width="24rem">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <NavLink to="/">
                                <div className="flex flex-col gap-0.5 leading-none">
                                    <span className="text-xl font-bold">
                                        Nest
                                    </span>
                                </div>
                            </NavLink>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {safeDetails && (
                                <>
                                    <SafeDetails safeDetails={safeDetails} />
                                    <hr className="my-4 border-t border-200" />
                                    <FundSafe safeAddress={safeDetails.address} />
                                </>
                            )}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <ConnectButton />
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
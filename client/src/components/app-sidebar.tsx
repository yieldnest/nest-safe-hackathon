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
import { NavLink, useLocation } from "react-router-dom";
import { Settings, ChevronRight } from "lucide-react";
import ConnectionStatus from "./connection-status";
import { ConnectButton } from "./ConnectButton";

export function AppSidebar() {
    const location = useLocation();

    return (
        <Sidebar className="w-[257px] m-3 h-[calc(100svh-1.5rem)] bg-nest rounded-sm border border-nest-light">
            {/* Header with Logo and Title */}
            <SidebarHeader className="px-4">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild className="h-20">
                            <NavLink to="/" className="flex items-center gap-3">
                                <img
                                    alt="NEST AI"
                                    src="/nest-pfp.png"
                                    className="h-12 w-12"
                                />
                                <div className="flex flex-col">
                                    <span className="font-bold text-nest-gold text-sm">
                                        NEST AI
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        Not Financial
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        Advice for DeFi Users
                                    </span>
                                </div>
                            </NavLink>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <div className="border-b border-nest-border mx-4" />

            {/* Main Navigation */}
            <SidebarContent className="px-0">
                <SidebarGroup className="px-0">
                    <div className="px-6 py-2">
                        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            AGENTS
                        </h2>
                    </div>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem className="relative">
                                <div className="absolute top-0 left-0 w-1 h-full bg-nest-gold rounded-r-md" />
                                <NavLink to="/chat">
                                    <SidebarMenuButton
                                        isActive={location.pathname.includes(
                                            "/chat"
                                        )}
                                        className="w-[90%] flex items-center gap-2 hover:bg-nest-light transition-colors pl-5 rounded-l-none"
                                    >
                                        <img
                                            src="/funds-box.svg"
                                            className="h-4 w-4"
                                        />
                                        <span>Nest AI</span>
                                        <ChevronRight className="h-4 w-4 text-gray-400 ml-auto" />
                                    </SidebarMenuButton>
                                </NavLink>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            {/* Footer Section */}
            <SidebarFooter>
                <SidebarMenu className="gap-1.5 px-5 mb-2">
                    {/* Others Section */}
                    {/* <div className="py-2">
                        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            OTHERS
                        </h2>
                    </div>
                    <NavLink to="/settings" className="flex items-center gap-2 ml-3">
                        <Settings className="h-4 w-4" />
                        <span>Settings</span>
                    </NavLink> */}

                    {/* External Wallet Section */}
                    <div className="py-2">
                        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            EXTERNAL WALLET
                        </h2>
                    </div>
                    <div className="w-full">
                        <ConnectButton />
                    </div>
                    <div className="w-full bg-nest-light rounded">
                        <ConnectionStatus />
                    </div>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}

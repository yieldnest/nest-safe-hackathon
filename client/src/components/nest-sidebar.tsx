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
import { Wallet, Users, Copy } from "lucide-react";
import { ConnectButton } from "./ConnectButton";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import { useDefaultAgent } from "@/hooks/use-default-agent";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

interface SafeDetails {
    address: string;
    owners: string[];
    threshold: number;
}

export function NestSidebar() {
    const { address, isConnected } = useAccount();
    const { agent } = useDefaultAgent();
    const [safeDetails, setSafeDetails] = useState<SafeDetails | undefined>();
    const { toast } = useToast();

    const truncateAddress = (addr: string) => {
        if (!addr) return "";
        return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
    };

    useEffect(() => {
        const checkExistingSafe = async () => {
            if (!agent?.id || !isConnected || !address) {
                setSafeDetails(undefined);
                return;
            }

            try {
                const response = await apiClient.executeAction("CHECK_SAFE_ACCOUNT", {
                    ownerAddress: address
                }, agent.id);
                
                if (response.content?.content?.isSafeDeployed) {
                    setSafeDetails({
                        address: response.content.content.safeAddress,
                        owners: response.content.content.safeOwners,
                        threshold: response.content.content.safeThreshold
                    });
                } else {
                    setSafeDetails(undefined);
                }
            } catch (error) {
                console.error("Error checking Safe:", error);
                toast({
                    title: "Error",
                    description: "Failed to check Safe status",
                    variant: "destructive",
                });
                setSafeDetails(undefined);
            }
        };

        checkExistingSafe();
    }, [agent?.id, address, isConnected]);

    return (
        <Sidebar 
            side="right" 
            width="24rem"
        >
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
                                    <SidebarMenuItem>
                                        <div className="flex flex-col gap-2 px-2 py-2">
                                            <div className="flex items-center gap-2">
                                                <Wallet className="size-4" />
                                                <span className="text-xs font-medium text-muted-foreground">Safe Account</span>
                                            </div>
                                            <div className="pl-6 flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground">{truncateAddress(safeDetails.address)}</span>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="size-4" 
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(safeDetails.address);
                                                                toast({
                                                                    description: "Address copied to clipboard",
                                                                });
                                                            }}
                                                        >
                                                            <Copy className="size-3" />
                                                            <span className="sr-only">Copy address</span>
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Copy address</TooltipContent>
                                                </Tooltip>
                                            </div>
                                        </div>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <div className="flex flex-col gap-2 px-2 py-2">
                                            <div className="flex items-center gap-2">
                                                <Users className="size-4" />
                                                <span className="text-xs font-medium text-muted-foreground">Signers</span>
                                            </div>
                                            <div className="flex flex-col gap-1.5 pl-6">
                                                {safeDetails.owners.map((owner) => (
                                                    <div key={owner} className="flex items-center gap-2">
                                                        <span className="text-xs text-muted-foreground">
                                                            {truncateAddress(owner)}
                                                            {owner.toLowerCase() === address?.toLowerCase() && (
                                                                <Badge variant="outline" className="ml-1 text-[10px] px-1 py-0">You</Badge>
                                                            )}
                                                            {owner.toLowerCase() !== address?.toLowerCase() && (
                                                                <Badge variant="outline" className="ml-1 text-[10px] px-1 py-0">Nest</Badge>
                                                            )}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </SidebarMenuItem>
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
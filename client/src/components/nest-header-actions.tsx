import { Copy, FileText, ExternalLink } from "lucide-react";
import { useAccount, useBalance } from "wagmi";
import { useSafeDetails } from "@/hooks/use-safe-details";
import { truncateAddress } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { Button } from "./ui/button";
import { toast } from "@/hooks/use-toast";
import { formatUnits } from "viem";

export function NestHeaderActions() {
    const { isConnected } = useAccount();
    const { safeDetails } = useSafeDetails();
    const { data: safeBalanceData } = useBalance({ address: safeDetails?.address as `0x${string}`, enabled: !!safeDetails?.address });

    return (
        <div className="flex items-center gap-3 mt-4">
            {isConnected && !safeDetails && (
                <button 
                    className="flex items-center gap-2 px-3 py-2 rounded-[8px] bg-nest border border-nest-gold text-white hover:bg-nest-light transition-colors"
                >
                    <FileText className="h-5 w-5 text-nest-gold" />
                    <span className="text-sm text-nowrap">Create Nest Account</span>
                </button>
            )}
            {
                safeDetails && (
                    <>
                        <div 
                            className="flex items-center gap-2 px-3 py-2 rounded-[8px] bg-nest-page border border-nest-super-light text-white"
                        >
                            <span className="text-sm text-nowrap font-medium">{truncateAddress(safeDetails.address)}</span>
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
                                        <Copy className="size-3 text-nest-gold" />
                                        <span className="sr-only">Copy address</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Copy address</TooltipContent>
                            </Tooltip>  
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="size-4" 
                                        onClick={() => {
                                            window.open(`https://app.safe.global/home?safe=arb1:${safeDetails.address}`, '_blank');
                                        }}
                                    >
                                        <ExternalLink className="size-3 text-nest-gold" />
                                        <span className="sr-only">See in explorer</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>See in Safe</TooltipContent>
                            </Tooltip>  
                        </div>
                        <div 
                            className="flex items-center gap-2 px-3 py-2 rounded-[8px] bg-nest-page border border-nest-super-light text-white"
                        >
                            <span className="text-sm text-nowrap font-medium">{parseFloat(formatUnits(safeBalanceData?.value || 0n, safeBalanceData?.decimals || 18)).toFixed(6)}</span>
                            <img src="https://app.yieldnest.finance/tokens/ETH.svg?fallback=true" className="size-5" />
                        </div>
                    </>
                )
            }
        </div>
    );
} 
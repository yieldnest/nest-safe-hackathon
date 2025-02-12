import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Wallet, Users, Copy } from 'lucide-react';
import { useAccount, useBalance } from 'wagmi';
import { useToast } from '@/hooks/use-toast';
import { truncateAddress } from '@/lib/utils';

interface SafeDetailsProps {
    safeDetails: {
        address: string;
        owners: string[];
    };
}

export function SafeDetails({ safeDetails }: SafeDetailsProps) {
    const { address } = useAccount();
    const { toast } = useToast();
    const { data: safeBalanceData } = useBalance({ address: safeDetails.address as `0x${string}` });

    return (
        <>
            <div className="flex flex-col gap-2 px-2 py-2">
                <div className="flex items-center gap-2">
                    <Wallet className="size-4" />
                    <span className="text-lg font-medium">Safe Account</span>
                </div>
                <div className="pl-6">
                    <div className="flex items-center gap-2 mb-1">
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
                    {safeBalanceData && (
                        <span className="text-xs text-muted-foreground">
                            {parseFloat(safeBalanceData.formatted).toFixed(6)} ETH
                        </span>
                    )}
                </div>
            </div>
            <div className="flex flex-col gap-2 px-2 py-2">
                <div className="flex items-center gap-2">
                    <Users className="size-4" />
                    <span className="text-lg font-medium">Signers</span>
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
        </>
    );
} 
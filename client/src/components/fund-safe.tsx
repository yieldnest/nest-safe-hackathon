import { useState } from 'react';
import { useSendTransaction, useAccount, useBalance } from 'wagmi';
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';
import { useSafeDetails } from '@/hooks/use-safe-details';

interface FundSafeProps {
    safeAddress?: string;
}

export function FundSafe({ safeAddress }: FundSafeProps) {
    const { toast } = useToast();
    const [amount, setAmount] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const { address } = useAccount();
    const { data: balanceData } = useBalance({ address });
    const { refetch: refetchSafeDetails } = useSafeDetails();

    const handleMaxClick = () => {
        if (balanceData) {
            const maxAmount = (parseFloat(balanceData.formatted) * 0.95).toFixed(4);
            setAmount(maxAmount);
        }
    };

    const handleFundSafe = () => {
        if (!amount || parseFloat(amount) <= 0) {
            toast({
                title: "Invalid Amount",
                description: "Please enter a valid amount of ETH.",
                variant: "destructive",
            });
            return;
        }
        setIsLoading(true);
        sendTransaction();
    };

    const { sendTransaction } = useSendTransaction({
        to: safeAddress,
        value: amount ? BigInt(parseFloat(amount) * 1e18) : BigInt(0), // Convert ETH to wei
        onSuccess: async () => {
            setIsLoading(false);
            toast({
                title: "Transaction Sent",
                description: `Successfully sent ${amount} ETH to the Safe.`,
            });
            // Wait for transaction confirmation and then refetch safe details
            await refetchSafeDetails();
        },
        onError: (error) => {
            setIsLoading(false);
            toast({
                title: "Transaction Failed",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    return (
        <div className="bg-nest rounded-sm border border-nest-light flex flex-col gap-4 px-2 py-2 w-full">
            <div className="relative">
                <div className="flex items-center border rounded-md bg-nest-super-light">
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Enter amount in ETH"
                        className="bg-nest-super-light input h-12 px-4 py-2 flex-1 appearance-none rounded-l-md bg-nest-page focus:outline-none"
                        style={{ MozAppearance: 'textfield' }}
                        onWheel={(e) => e.currentTarget.blur()}
                    />
                    <span onClick={handleMaxClick} className="cursor-pointer px-2.5 py-1 bg-nest-gold rounded-md mr-2 text-nest font-medium text-xs">
                        Max
                    </span>
                </div>
                {balanceData && (
                    <div className="text-xs text-muted-foreground text-right mt-2">
                        Balance: {parseFloat(balanceData.formatted).toFixed(6)} ETH
                    </div>
                )}
            </div>
            <Button onClick={handleFundSafe} disabled={!amount || isLoading} className='bg-nest-gold text-nest h-12'>
                {isLoading ? <Loader2 className="animate-spin mr-2" /> : null}
                Deposit
            </Button>
        </div>
    );
} 
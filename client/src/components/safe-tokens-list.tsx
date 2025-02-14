import { useSafeTokens } from "@/hooks/use-safe-tokens";

interface TokenItemProps {
    symbol: string;
    name: string;
    balance: string;
    icon: string;
    isNative?: boolean;
}

const TokenItem = ({ symbol, name, balance, icon, isNative }: TokenItemProps) => {
    return (
        <div className="flex items-center justify-between py-3 px-3.5 hover:bg-nest-light transition-colors cursor-pointer group">
            <div className="flex items-center gap-3">
                <div className="relative">
                    <img 
                        src={icon} 
                        alt={symbol} 
                        className={`w-10 h-10 rounded-full ${!isNative ? 'bg-nest-gold/10' : ''}`} 
                    />
                </div>
                <div className="flex flex-col">
                    <span className="text-white font-medium text-base">{symbol}</span>
                    <span className="text-gray-400 text-sm">{name}</span>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-white font-medium text-base">
                    {balance === '--' ? balance : Number(balance).toFixed(3)}
                </span>
            </div>
        </div>
    );
};

export const SafeTokensList = () => {
    const { data = [], isLoading } = useSafeTokens();

    if (isLoading) {
        return <div className="animate-pulse">Loading...</div>;
    }

    return (
        <div className="flex flex-col">
            {data.map((token, index) => (
                <TokenItem 
                    key={`${token.symbol}-${index}`}
                    symbol={token.symbol}
                    name={token.name}
                    balance={token.balance_formatted}
                    icon={token.logo}
                    isNative={token.native_token}
                />
            ))}
        </div>
    );
};
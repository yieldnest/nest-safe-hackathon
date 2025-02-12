import { FileText } from "lucide-react";
import { useAccount } from "wagmi";
import { useSafeDetails } from "@/hooks/use-safe-details";

export function NestHeaderActions() {
    const { isConnected } = useAccount();
    const safeDetails = useSafeDetails();

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
        </div>
    );
} 
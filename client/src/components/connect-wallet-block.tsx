import { Wallet } from "lucide-react";

export function ConnectWalletBlock() {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4">
            <Wallet className="h-10 w-10 text-nest-gold mb-4" />
            <h3 className="text-xl text-white font-medium mb-2">
                Connect Wallet
            </h3>
            <p className="text-gray-400 text-sm text-center mb-8">
                After you connect, your tokens will be shown here.
            </p>
        </div>
    );
} 
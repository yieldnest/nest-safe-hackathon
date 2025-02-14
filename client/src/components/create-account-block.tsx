import { Wallet } from "lucide-react";

export function CreateAccountBlock() {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="mb-6">
                <Wallet className="h-12 w-12 text-nest-gold" />
            </div>
            <h2 className="text-2xl text-white font-medium mb-3">
                Create Account
            </h2>
            <p className="text-gray-400 text-sm text-center mb-8">
                After you create your account, you can start to access your tokens here.
            </p>
        </div>
    );
} 
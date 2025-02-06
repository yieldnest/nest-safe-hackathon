import { ConnectButton } from "./ConnectButton";

export function Navbar() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 max-w-screen-2xl items-center px-4">
                <div className="mr-4 flex">
                    <a className="mr-6 flex items-center space-x-2" href="/">
                        <span className="text-xl font-bold">
                            Nest
                        </span>
                    </a>
                </div>
                <div className="flex flex-1 items-center space-x-2 justify-end">
                    <ConnectButton />
                </div>
            </div>
        </header>
    );
} 
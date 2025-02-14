import { ConnectButton as RainbowConnectButton } from '@rainbow-me/rainbowkit';
import { Button } from "./ui/button";

export function ConnectButton() {
    return (
        <RainbowConnectButton.Custom>
            {({
                account,
                chain,
                openAccountModal,
                openChainModal,
                openConnectModal,
                mounted,
            }) => {
                const ready = mounted;
                const connected = ready && account && chain;

                return (
                    <div
                        {...(!ready && {
                            'aria-hidden': true,
                            style: {
                                opacity: 0,
                                pointerEvents: 'none',
                                userSelect: 'none',
                            },
                        })}
                    >
                        {(() => {
                            if (!connected) {
                                return (
                                    <Button onClick={openConnectModal} className="
                                        w-full border border-white bg-nest-light text-white rounded hover:bg-nest-gold hover:text-nest-light
                                    ">
                                        Connect Wallet
                                    </Button>
                                );
                            }

                            if (chain.unsupported) {
                                return (
                                    <Button onClick={openChainModal} variant="destructive">
                                        Wrong network
                                    </Button>
                                );
                            }

                            return (
                                <Button onClick={openAccountModal} className="
                                    w-full border border-white bg-nest-light text-white rounded hover:bg-nest-gold hover:text-nest-light
                                ">
                                    {account.displayName}
                                </Button>
                            );
                        })()}
                    </div>
                );
            }}
        </RainbowConnectButton.Custom>
    );
} 
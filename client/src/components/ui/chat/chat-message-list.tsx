import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";
import * as React from "react";

interface ChatMessageListProps extends React.HTMLAttributes<HTMLDivElement> {
    scrollRef: React.RefObject<HTMLDivElement | null>;
    isAtBottom: boolean;
    scrollToBottom: () => void;
    disableAutoScroll: () => void;
    smooth?: boolean;
}

const ChatMessageList = React.forwardRef<HTMLDivElement, ChatMessageListProps>(
    (
        {
            className,
            children,
            scrollRef,
            isAtBottom,
            scrollToBottom,
            disableAutoScroll,
        },
        ref
    ) => {
        const containerRef = scrollRef || ref;

        return (
            <div className="relative w-full h-full">
                <div
                    className={`flex flex-col w-full h-full p-4 overflow-y-auto ${className}`}
                    ref={containerRef}
                    onWheel={disableAutoScroll}
                    onTouchMove={disableAutoScroll}
                >
                    <div className="flex flex-col gap-5">{children}</div>
                </div>

                {!isAtBottom && (
                    <Button
                        onClick={scrollToBottom}
                        size="icon"
                        variant="outline"
                        className="absolute bottom-2 left-1/2 transform -translate-x-1/2 inline-flex rounded-full shadow-md"
                    >
                        <ArrowDown className="h-4 w-4" />
                    </Button>
                )}
            </div>
        );
    }
);

ChatMessageList.displayName = "ChatMessageList";

export { ChatMessageList };

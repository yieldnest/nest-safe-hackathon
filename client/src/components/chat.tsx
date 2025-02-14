import { Button } from "@/components/ui/button";
import {
    ChatBubble,
    ChatBubbleMessage,
    ChatBubbleTimestamp,
} from "@/components/ui/chat/chat-bubble";
import { ChatInput } from "@/components/ui/chat/chat-input";
import { ChatMessageList } from "@/components/ui/chat/chat-message-list";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import { cn, moment } from "@/lib/utils";
import type { IAttachment } from "@/types";
import type { Content, UUID } from "@elizaos/core";
import { animated, useTransition, type AnimatedProps } from "@react-spring/web";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Paperclip, Send, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import AIWriter from "react-aiwriter";
import { useAccount } from "wagmi";
import { AudioRecorder } from "./audio-recorder";
import CopyButton from "./copy-button";
import { Avatar, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import ChatTtsButton from "./ui/chat/chat-tts-button";
import { useAutoScroll } from "./ui/chat/hooks/useAutoScroll";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { StrategyCard } from "./strategy-card";

type ExtraContentFields = {
    user: string;
    createdAt: number;
    isLoading?: boolean;
};

type Strategy = any; 

type ContentWithUser = Content & ExtraContentFields & { txInfo?: Strategy };

type AnimatedDivProps = AnimatedProps<{ style: React.CSSProperties }> & {
    children?: React.ReactNode;
};

export default function Page({ agentId }: { agentId: UUID }) {
    const { toast } = useToast();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [input, setInput] = useState("");
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const formRef = useRef<HTMLFormElement>(null);
    const [firstResponseReceived, setFirstResponseReceived] = useState(false);
    const { address, isConnected, isConnecting } = useAccount();
    const queryClient = useQueryClient();
    const [userAddress, setUserAddress] = useState<string | undefined>("");

    useEffect(() => {
        if (isConnected && !isConnecting) {
            setUserAddress(address);
        }
    }, [isConnected, address, isConnecting]);

    const getMessageVariant = (role: string) =>
        role !== "user" ? "received" : "sent";

    const { scrollRef, isAtBottom, scrollToBottom, disableAutoScroll } =
        useAutoScroll({
            smooth: true,
        });

    useEffect(() => {
        scrollToBottom();
    }, [queryClient.getQueryData(["messages", agentId])]);

    useEffect(() => {
        scrollToBottom();
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (e.nativeEvent.isComposing) return;
            // handleSendMessage(e as unknown as React.FormEvent<HTMLFormElement>);
            handleSend(e as unknown as React.FormEvent<HTMLFormElement>);
        }
    };

    const startConversationMutation = useMutation({
        mutationKey: ["start_conversation", agentId],
        mutationFn: async (message: string) => {
            if (!userAddress) {
                throw new Error("User address not loaded yet");
            }
            return apiClient.startConversation(agentId, message, userAddress);
        },
        onSuccess: (jobId: string) => {
            apiClient.startSse(agentId, jobId, (content) => {
                // Set flag for first response
                if (!firstResponseReceived) {
                    setFirstResponseReceived(true);
                }

                if (content.type === "complete") {
                    // Ensure we remove the loading message
                    queryClient.setQueryData<ContentWithUser[]>(
                        ["messages", agentId],
                        (old = []) => old.filter((msg) => !msg.isLoading)
                    );
                    // Force a re-render to ensure UI updates
                    queryClient.invalidateQueries({
                        queryKey: ["messages", agentId],
                        exact: true,
                    });
                    return;
                }

                queryClient.setQueryData<ContentWithUser[]>(
                    ["messages", agentId],
                    (old = []) => {
                        // Keep all messages except loading ones
                        const messages = old.filter((msg) => !msg.isLoading);

                        const newMessages = [
                            ...messages,
                            {
                                ...content,
                                createdAt: Date.now(),
                                user: content.user || "system",
                            },
                        ];

                        // Only add loading message if not complete
                        if (content.type !== "complete") {
                            newMessages.push({
                                text: "",
                                user: "system",
                                isLoading: true,
                                createdAt: Date.now() + 1,
                                action: "",
                                source: "",
                                attachments: [],
                            });
                        }

                        return newMessages;
                    }
                );
            });
        },
        onError: (err: any) => {
            console.error("Failed to start conversation:", err);
            queryClient.setQueryData(
                ["messages", agentId],
                (old: ContentWithUser[] = []) =>
                    old.filter((msg) => !msg.isLoading)
            );
            toast({
                variant: "destructive",
                title: "Unable to send message",
                description: err.message,
            });
        },
    });

    useEffect(() => {
        if (firstResponseReceived) {
            queryClient.invalidateQueries({ queryKey: ["messages", agentId] });
            setFirstResponseReceived(false); // Reset for next conversation
        }
    }, [firstResponseReceived, agentId, queryClient]);

    function handleSend(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!input) return;

        // 1) user message + loading
        const userMessage: ContentWithUser = {
            text: input,
            user: "user",
            createdAt: Date.now(),
            action: "", // Add missing fields
            source: "",
            attachments: [],
        };

        const loadingMessage: ContentWithUser = {
            text: "",
            user: "system",
            isLoading: true,
            createdAt: Date.now(),
            action: "",
            source: "",
            attachments: [],
        };

        // 2) Update query
        queryClient.setQueryData<ContentWithUser[]>(
            ["messages", agentId],
            (old = []) => [...old, userMessage, loadingMessage]
        );

        // 3) Fire mutation
        startConversationMutation.mutate(input);

        // 4) reset form
        setInput("");
        formRef.current?.reset();
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file?.type.startsWith("image/")) {
            setSelectedFile(file);
        }
    };

    const messages =
        queryClient.getQueryData<ContentWithUser[]>(["messages", agentId]) ||
        [];

    const transitions = useTransition(messages, {
        keys: (message: any) =>
            `${message.createdAt}-${message.user}-${message.text}`,
        from: { opacity: 0, transform: "translateY(50px)" },
        enter: { opacity: 1, transform: "translateY(0px)" },
        leave: { opacity: 0, transform: "translateY(10px)" },
    });

    const CustomAnimatedDiv = animated.div as React.FC<AnimatedDivProps>;

    return (
        <div className="flex flex-col w-full h-[calc(100dvh)] px-5 py-3 gap-3">
            <div className="flex-1 overflow-y-auto bg-nest rounded-sm">
                <ChatMessageList
                    scrollRef={scrollRef}
                    isAtBottom={isAtBottom}
                    scrollToBottom={scrollToBottom}
                    disableAutoScroll={disableAutoScroll}
                >
                    {transitions((style: any, message: ContentWithUser) => {
                        const variant = getMessageVariant(message?.user);
                        const contentData = message.content ? (message.content as { data: { tx?: Strategy } }) : null;
                        return (
                            <CustomAnimatedDiv
                                style={{
                                    ...style,
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "0.5rem",
                                }}
                            >
                                <ChatBubble
                                    variant={variant}
                                    className="flex flex-row items-center gap-2"
                                >
                                    {message?.user !== "user" ? (
                                        <Avatar className="size-8 rounded-sm select-none border border-[#F4F4F1]">
                                            <AvatarImage src="/nest-pfp.png" />
                                        </Avatar>
                                    ) : null}
                                    <div className="flex flex-col">
                                        <ChatBubbleMessage
                                            isLoading={message?.isLoading}
                                            variant={variant}
                                        >
                                            {message?.user !== "user" ? (
                                                <AIWriter>
                                                    {message?.text}
                                                </AIWriter>
                                            ) : (
                                                message?.text
                                            )}
                                            {/* Attachments */}
                                            <div>
                                                {message?.attachments?.map(
                                                    (
                                                        attachment: IAttachment
                                                    ) => (
                                                        <div
                                                            className="flex flex-col gap-1 mt-2"
                                                            key={`${attachment.url}-${attachment.title}`}
                                                        >
                                                            <img
                                                                alt="attachment"
                                                                src={
                                                                    attachment.url
                                                                }
                                                                width="100%"
                                                                height="100%"
                                                                className="w-64 rounded-md"
                                                            />
                                                            <div className="flex items-center justify-between gap-4">
                                                                <span />
                                                                <span />
                                                            </div>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </ChatBubbleMessage>
                                        <div className="flex items-center gap-4 justify-between w-full mt-1">
                                            {message?.text &&
                                            !message?.isLoading ? (
                                                <div className="flex items-center gap-1">
                                                    <CopyButton
                                                        text={message?.text}
                                                    />
                                                    <ChatTtsButton
                                                        agentId={agentId}
                                                        text={message?.text}
                                                    />
                                                </div>
                                            ) : null}
                                            <div
                                                className={cn([
                                                    message?.isLoading
                                                        ? "mt-2"
                                                        : "",
                                                    "flex items-center justify-between gap-4 select-none",
                                                ])}
                                            >
                                                {message?.source ? (
                                                    <Badge variant="outline">
                                                        {message.source}
                                                    </Badge>
                                                ) : null}
                                                {message?.action ? (
                                                    <Badge variant="outline">
                                                        {message.action}
                                                    </Badge>
                                                ) : null}
                                                {message?.createdAt ? (
                                                    <ChatBubbleTimestamp
                                                        timestamp={moment(
                                                            message?.createdAt
                                                        ).format("LT")}
                                                    />
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                </ChatBubble>
                                {contentData && contentData.data.tx && (
                                    <StrategyCard strategy={contentData.data.tx} />
                                )}
                            </CustomAnimatedDiv>
                        );
                    })}
                </ChatMessageList>
            </div>
            <form
                ref={formRef}
                onSubmit={handleSend}
                className="relative rounded-md border bg-nest-super-light"
            >
                {selectedFile ? (
                    <div className="p-3 flex">
                        <div className="relative rounded-md border p-2">
                            <Button
                                onClick={() => setSelectedFile(null)}
                                className="absolute -right-2 -top-2 size-[22px] ring-2 ring-background"
                                variant="outline"
                                size="icon"
                            >
                                <X />
                            </Button>
                            <img
                                alt="Selected file"
                                src={URL.createObjectURL(selectedFile)}
                                height="100%"
                                width="100%"
                                className="aspect-square object-contain w-16"
                            />
                        </div>
                    </div>
                ) : null}
                <ChatInput
                    ref={inputRef}
                    onKeyDown={handleKeyDown}
                    value={input}
                    onChange={({ target }) => setInput(target.value)}
                    placeholder="Type your message here..."
                    className="min-h-12 resize-none rounded-md bg-nest-super-light border-0 p-3 shadow-none focus-visible:ring-0"
                />
                <div className="flex items-center p-3 pt-0">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                        if (fileInputRef.current) {
                                            fileInputRef.current.click();
                                        }
                                    }}
                                >
                                    <Paperclip className="size-4" />
                                    <span className="sr-only">
                                        Attach file
                                    </span>
                                </Button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept="image/*"
                                    className="hidden"
                                />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="left">
                            <p>Attach file</p>
                        </TooltipContent>
                    </Tooltip>
                    <AudioRecorder
                        agentId={agentId}
                        onChange={(newInput: string) => setInput(newInput)}
                    />
                    <Button
                        disabled={
                            !input || startConversationMutation?.isPending
                        }
                        type="submit"
                        size="sm"
                        className="ml-auto gap-1.5 h-[30px]"
                    >
                        {startConversationMutation?.isPending
                            ? "..."
                            : "Send Message"}
                        <Send className="size-3.5" />
                    </Button>
                </div>
            </form>
        </div>
    );
}

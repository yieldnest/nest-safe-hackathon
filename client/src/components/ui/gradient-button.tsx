import { cn } from "@/lib/utils";

interface GradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children?: React.ReactNode;
    className?: string;
}

export function GradientButton({ children, className, ...props }: GradientButtonProps) {
    return (
        <button
            className={cn(
                "relative group",
                "px-16 py-4",
                "bg-[url('/gradient-button.png')] bg-contain bg-no-repeat bg-center",
                "filter drop-shadow-[0px_6px_6px_rgba(0,0,0,0.25)]",
                className
            )}
            {...props}
        >
            <span className="relative text-nest text-xl font-bold">
                {children}
            </span>
        </button>
    );
} 
import { cn } from "@/lib/utils";

interface OnlineIndicatorProps {
  isOnline: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const OnlineIndicator = ({ isOnline, size = "md", className }: OnlineIndicatorProps) => {
  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  if (!isOnline) return null;

  return (
    <span
      className={cn(
        "absolute rounded-full bg-green-500 ring-2 ring-background",
        sizeClasses[size],
        className
      )}
    />
  );
};

export default OnlineIndicator;

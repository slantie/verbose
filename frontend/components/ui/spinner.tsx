import React from "react";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Spinner({ size = "md", className = "" }: SpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-2",
    lg: "h-12 w-12 border-3",
  };

  return (
    <div
      className={`animate-spin rounded-full border-t-transparent ${sizeClasses[size]} ${className}`}
      style={{
        borderTopColor: "transparent",
        borderRightColor: "currentColor",
        borderBottomColor: "currentColor",
        borderLeftColor: "currentColor",
      }}
    />
  );
}

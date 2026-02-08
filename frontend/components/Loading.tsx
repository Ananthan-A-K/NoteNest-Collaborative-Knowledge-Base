import React from "react";

interface LoadingProps {
  message?: string;
  className?: string;
  /** Use for full-page or large content area loading */
  fullPage?: boolean;
  /** Spinner and layout size */
  size?: "sm" | "md" | "lg";
}

const sizeConfig = {
  sm: { spinner: "w-6 h-6", minHeight: "min-h-[120px]" },
  md: { spinner: "w-10 h-10", minHeight: "min-h-[200px]" },
  lg: { spinner: "w-12 h-12", minHeight: "min-h-[280px]" },
};

export default function Loading({
  message,
  className = "",
  fullPage = false,
  size = "md",
}: LoadingProps) {
  const config = sizeConfig[size];
  const minHeightClass = fullPage ? config.minHeight : "py-8";

  return (
    <div
      className={`flex flex-col items-center justify-center ${minHeightClass} animate-fade-in ${className}`}
      role="status"
      aria-live="polite"
      aria-label={message ?? "Loading content"}
    >
      <div
        className={`rounded-full border-2 border-t-transparent animate-spin ${config.spinner}`}
        style={{
          borderColor: "rgba(59, 130, 246, 0.25)",
          borderTopColor: "var(--color-info)",
        }}
      />
      {message && (
        <p
          className="mt-3 text-sm font-medium"
          style={{
            color: "var(--color-text-secondary)",
            fontSize: "var(--font-size-sm)",
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
}

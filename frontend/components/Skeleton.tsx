import React from "react";

interface SkeletonProps {
  className?: string;
  /** Line variant: single line, or multiple lines (e.g. 3 for list item) */
  lines?: number;
  /** Card variant: rounded card placeholder */
  variant?: "line" | "card" | "list-item" | "avatar";
}

export default function Skeleton({
  className = "",
  lines = 1,
  variant = "line",
}: SkeletonProps) {
  const baseStyle: React.CSSProperties = {
    backgroundColor: "var(--color-border-light)",
    borderRadius: "var(--space-sm, 0.5rem)",
  };

  if (variant === "card") {
    return (
      <div
        className={`loading-pulse w-full ${className}`}
        style={{ ...baseStyle, minHeight: "6rem" }}
        aria-hidden="true"
      />
    );
  }

  if (variant === "avatar") {
    return (
      <div
        className={`loading-pulse rounded-full shrink-0 ${className}`}
        style={{ ...baseStyle, width: "2.5rem", height: "2.5rem" }}
        aria-hidden="true"
      />
    );
  }

  if (variant === "list-item") {
    return (
      <div
        className={`flex flex-col gap-2 p-4 rounded-lg border ${className}`}
        style={{
          borderColor: "var(--color-border-light)",
        }}
        aria-hidden="true"
      >
        <div
          className="loading-pulse h-4 rounded"
          style={{ ...baseStyle, width: "70%", maxWidth: "12rem" }}
        />
        <div
          className="loading-pulse h-3 rounded"
          style={{ ...baseStyle, width: "40%", maxWidth: "8rem" }}
        />
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="loading-pulse h-4 rounded"
          style={{
            ...baseStyle,
            width: i === lines - 1 && lines > 1 ? "60%" : "100%",
          }}
        />
      ))}
    </div>
  );
}

/** Skeleton for a list of items with staggered pulse delay */
export function SkeletonList({
  count = 3,
  variant = "list-item",
  className = "",
}: {
  count?: number;
  variant?: "line" | "card" | "list-item";
  className?: string;
}) {
  return (
    <ul className={`space-y-2 ${className}`} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <li
          key={i}
          className="animate-fade-in"
          style={{
            animationDelay: `${i * 80}ms`,
            animationFillMode: "backwards",
          }}
        >
          <Skeleton variant={variant} />
        </li>
      ))}
    </ul>
  );
}

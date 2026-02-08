import React from "react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  /** Secondary action (e.g. link) below primary CTA */
  secondaryAction?: React.ReactNode;
  className?: string;
  /** Visual size: compact (cards), default, or large (full page) */
  size?: "compact" | "default" | "large";
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className = "",
  size = "default",
}: EmptyStateProps) {
  const sizeClass =
    size === "compact"
      ? "empty-state-content--compact"
      : size === "large"
        ? "empty-state-content--large"
        : "";
  const wrapperClass = size === "compact" ? "empty-state--compact" : "";

  return (
    <div
      className={`empty-state animate-fade-in-up ${wrapperClass} ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className={`empty-state-content ${sizeClass}`}>
        {icon && (
          <div
            className="empty-state-icon"
            aria-hidden="true"
            style={{ color: "var(--color-text-muted)" }}
          >
            {icon}
          </div>
        )}
        <h3 className="empty-state-title">{title}</h3>
        {description && (
          <p className="empty-state-description">{description}</p>
        )}
        {action && (
          <div className="empty-state-action">{action}</div>
        )}
        {secondaryAction && (
          <div
            className="empty-state-action mt-2"
            style={{ marginTop: "var(--space-sm)" }}
          >
            {secondaryAction}
          </div>
        )}
      </div>
    </div>
  );
}

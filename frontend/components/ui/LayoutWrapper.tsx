"use client";

import React, { useState, useEffect, ReactNode } from "react";
import { LayoutControl } from "./LayoutControl";
import { cn } from "@/lib/utils";

interface LayoutValues {
    x: number;
    y: number;
    scale: number;
    rotate: number;
}

interface LayoutWrapperProps {
    children: ReactNode;
    id: string; // Unique ID for this wrapper
    defaultX?: number;
    defaultY?: number;
    defaultScale?: number;
    defaultRotate?: number;
    className?: string; // Class for the wrapper div
    style?: React.CSSProperties; // Initial styles (merged with transforms)
}

export const LayoutWrapper: React.FC<LayoutWrapperProps> = ({
    children,
    id,
    defaultX = 0,
    defaultY = 0,
    defaultScale = 1,
    defaultRotate = 0,
    className,
    style,
}) => {
    // If we receive transform in style, we might want to parse it, but for now let's rely on explicit props or defaults.
    // Actually, to make it seamless, we default to the props provided.

    const [values, setValues] = useState<LayoutValues>({
        x: defaultX,
        y: defaultY,
        scale: defaultScale,
        rotate: defaultRotate,
    });

    const [isOpen, setIsOpen] = useState(false);

    const handleReset = () => {
        setValues({
            x: defaultX,
            y: defaultY,
            scale: defaultScale,
            rotate: defaultRotate,
        });
    };

    return (
        <div
            className={cn("relative group border border-transparent hover:border-dashed hover:border-blue-300", className)}
            style={{
                ...style,
                transform: `translate(${values.x}px, ${values.y}px) scale(${values.scale}) rotate(${values.rotate}deg)`,
                transformOrigin: style?.transformOrigin || 'center center',
            }}
        >
            {/* Only show the control button/panel when hovered or open */}
            <div className={cn(
                "absolute inset-0 z-50 transition-opacity pointer-events-none",
                isOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}>
                <LayoutControl
                    id={id}
                    values={values}
                    onChange={setValues}
                    onReset={handleReset}
                    isOpen={isOpen}
                    setIsOpen={setIsOpen}
                />
            </div>
            {children}
        </div>
    );
};

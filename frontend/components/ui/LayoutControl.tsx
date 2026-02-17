"use client";

import React, { useState, useEffect } from "react";
import { Copy, RefreshCw, X, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";

interface LayoutValues {
    x: number;
    y: number;
    scale: number;
    rotate: number;
}

interface LayoutControlProps {
    id: string; // Unique ID to help identify which component is being tuned
    values: LayoutValues;
    onChange: (newValues: LayoutValues) => void;
    onReset: () => void;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

export const LayoutControl: React.FC<LayoutControlProps> = ({
    id,
    values,
    onChange,
    onReset,
    isOpen,
    setIsOpen,
}) => {
    const [copied, setCopied] = useState(false);

    // Generate the transform string for copying
    const transformString = `transform: 'translate(${values.x}px, ${values.y}px) scale(${values.scale}) rotate(${values.rotate}deg)'`;
    // Also handy: Tailwind arbitrary values
    const tailwindString = `translate-x-[${values.x}px] translate-y-[${values.y}px] scale-[${values.scale}] rotate-[${values.rotate}deg]`;

    const handleCopy = () => {
        navigator.clipboard.writeText(transformString);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="absolute top-2 right-2 z-50 p-2 bg-black/80 text-white rounded-md shadow-lg hover:bg-black transition-colors text-xs font-mono opacity-50 hover:opacity-100 pointer-events-auto"
            >
                Tune
            </button>
        );
    }

    return (
        <div className="absolute top-2 right-2 z-50 w-64 bg-white/95 backdrop-blur shadow-xl border border-gray-200 rounded-lg p-4 font-mono text-xs pointer-events-auto">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
                <span className="font-bold text-gray-700 truncate" title={id}>{id}</span>
                <div className="flex gap-2">
                    <button onClick={onReset} className="p-1 hover:bg-gray-100 rounded text-gray-500" title="Reset">
                        <RefreshCw size={12} />
                    </button>
                    <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-100 rounded text-gray-500" title="Close">
                        <X size={12} />
                    </button>
                </div>
            </div>

            <div className="space-y-3">
                {/* X Control */}
                <div className="flex items-center gap-2">
                    <label className="w-8 text-gray-500">X</label>
                    <input
                        type="range"
                        min="-500"
                        max="500"
                        value={values.x}
                        onChange={(e) => onChange({ ...values, x: Number(e.target.value) })}
                        className="flex-1"
                    />
                    <input
                        type="number"
                        value={values.x}
                        onChange={(e) => onChange({ ...values, x: Number(e.target.value) })}
                        className="w-12 p-1 border rounded text-right"
                    />
                </div>

                {/* Y Control */}
                <div className="flex items-center gap-2">
                    <label className="w-8 text-gray-500">Y</label>
                    <input
                        type="range"
                        min="-500"
                        max="500"
                        value={values.y}
                        onChange={(e) => onChange({ ...values, y: Number(e.target.value) })}
                        className="flex-1"
                    />
                    <input
                        type="number"
                        value={values.y}
                        onChange={(e) => onChange({ ...values, y: Number(e.target.value) })}
                        className="w-12 p-1 border rounded text-right"
                    />
                </div>

                {/* Scale Control */}
                <div className="flex items-center gap-2">
                    <label className="w-8 text-gray-500">Sc</label>
                    <input
                        type="range"
                        min="0.1"
                        max="5"
                        step="0.01"
                        value={values.scale}
                        onChange={(e) => onChange({ ...values, scale: Number(e.target.value) })}
                        className="flex-1"
                    />
                    <input
                        type="number"
                        step="0.01"
                        value={values.scale}
                        onChange={(e) => onChange({ ...values, scale: Number(e.target.value) })}
                        className="w-12 p-1 border rounded text-right"
                    />
                </div>

                {/* Rotate Control */}
                <div className="flex items-center gap-2">
                    <label className="w-8 text-gray-500">Rot</label>
                    <input
                        type="range"
                        min="-360"
                        max="360"
                        value={values.rotate}
                        onChange={(e) => onChange({ ...values, rotate: Number(e.target.value) })}
                        className="flex-1"
                    />
                    <input
                        type="number"
                        value={values.rotate}
                        onChange={(e) => onChange({ ...values, rotate: Number(e.target.value) })}
                        className="w-12 p-1 border rounded text-right"
                    />
                </div>

                {/* Nudge Controls */}
                <div className="pt-2 border-t mt-2">
                    <div className="text-[10px] uppercase text-gray-400 font-bold mb-1 text-center">Nudge (1px)</div>
                    <div className="flex flex-col items-center gap-1">
                        <button
                            onClick={() => onChange({ ...values, y: values.y - 1 })}
                            className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300"
                            title="Up"
                        >
                            <ArrowUp size={12} />
                        </button>
                        <div className="flex gap-1">
                            <button
                                onClick={() => onChange({ ...values, x: values.x - 1 })}
                                className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300"
                                title="Left"
                            >
                                <ArrowLeft size={12} />
                            </button>
                            <button
                                onClick={() => onChange({ ...values, y: values.y + 1 })}
                                className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300"
                                title="Down"
                            >
                                <ArrowDown size={12} />
                            </button>
                            <button
                                onClick={() => onChange({ ...values, x: values.x + 1 })}
                                className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300"
                                title="Right"
                            >
                                <ArrowRight size={12} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="pt-2 border-t mt-2">
                    <button
                        onClick={handleCopy}
                        className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-1.5 rounded hover:bg-black transition-colors"
                    >
                        <Copy size={12} />
                        {copied ? "Copied!" : "Copy CSS"}
                    </button>
                    <div className="text-[10px] text-center text-gray-400 mt-1 select-all font-mono">
                        {transformString}
                    </div>
                </div>
            </div>
        </div>
    );
};

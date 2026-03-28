"use client";

import { cn } from "@/lib/utils";

const PRESET_COLORS = [
  "#06B6D4", // Cyan
  "#A855F7", // Purple
  "#EC4899", // Pink
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#3B82F6", // Blue
  "#F97316", // Orange
  "#8B5CF6", // Violet
  "#14B8A6", // Teal
];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  className?: string;
}

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {PRESET_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={cn(
            "h-8 w-8 rounded-full transition-all duration-150 hover:scale-110",
            value === color
              ? "ring-2 ring-white ring-offset-2 ring-offset-background scale-110"
              : "ring-1 ring-white/10 hover:ring-white/30"
          )}
          style={{ backgroundColor: color }}
          aria-label={`Select color ${color}`}
        />
      ))}
    </div>
  );
}

export { PRESET_COLORS };

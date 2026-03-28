import React from "react";

export function Logo({ className }: { className?: string }) {
  return (
    <div 
      className={`relative flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-800 shadow-xl overflow-hidden ${className || ""}`}
    >
      {/* Background capture grid hint matching the board */}
      <div 
        className="absolute inset-0 opacity-20 mix-blend-overlay"
        style={{
          backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
          backgroundSize: '4px 4px'
        }}
      />
      
      {/* The exact "Outfit" font matching the app's typography perfectly */}
      <span 
        className="relative z-10 font-black text-[22px] leading-none flex items-center justify-center h-full w-full text-white drop-shadow-sm" 
        style={{ fontFamily: "var(--font-outfit)" }}
      >
        C
      </span>
    </div>
  );
}

"use client";

import React, { useState, useCallback } from "react";
import type { BlockData, ProfileData } from "@/hooks/use-grid";

interface BlockProps {
  block: BlockData;
  profile: ProfileData | null;
  config: { id: number; x: number; y: number; size: number };
  isCurrentUser: boolean;
  onCapture: (blockId: number) => void;
  onUnclaim: (blockId: number) => void;
  canCapture: boolean;
}

export const Block = React.memo(function Block({
  block,
  profile,
  config,
  isCurrentUser,
  onCapture,
  onUnclaim,
  canCapture,
}: BlockProps) {
  const [animClass, setAnimClass] = useState("");

  const ownerColor = profile?.color || null;
  const isClaimed = !!block.owner_id;

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // prevent panning
    if (!canCapture) {
      if (!isClaimed) {
        setAnimClass("animate-shake"); // visual feedback for cooldown miss
        setTimeout(() => setAnimClass(""), 300);
      }
      return;
    }
    
    // If block is already claimed...
    if (block.owner_id) {
      if (isCurrentUser) {
        // Unclaim our own block
        setAnimClass("scale-95 opacity-50");
        onUnclaim(block.id);
        setTimeout(() => setAnimClass(""), 300);
      }
      return;
    }

    setAnimClass("animate-capture-pop z-[20]");
    onCapture(block.id);

    setTimeout(() => setAnimClass(""), 300);
  }, [block.id, block.owner_id, canCapture, onCapture, isClaimed]);

  return (
    <div
      className={`grid-block absolute rounded-full shadow-2xl transition-all duration-300 hover:scale-[1.03] cursor-pointer flex items-center justify-center ${animClass} group`}
      style={{
        left: config.x,
        top: config.y,
        width: config.size,
        height: config.size,
        backgroundColor: isClaimed ? ownerColor || "#666" : "#0A0A10",
        border: isClaimed ? `2px solid ${ownerColor}EE` : "2px solid #1E1E2A",
        boxShadow: isCurrentUser && isClaimed
          ? `0 0 30px 4px ${ownerColor}60, inset 0 0 16px 0 ${ownerColor}40`
          : isClaimed
            ? `0 0 16px 2px ${ownerColor}30, inset 0 0 8px 0 ${ownerColor}50`
            : "0 8px 24px rgba(0,0,0,0.8)",
        zIndex: isClaimed ? 10 : 1, // Claimed blocks sit above empty ones
      }}
      onClick={handleClick}
      title={
        isClaimed
          ? `${profile?.username || "Unknown"}${isCurrentUser ? " (you)" : ""}`
          : "Unclaimed — Click to capture!"
      }
    >
      {/* Inner subtle ring for unclaimed blocks */}
      {!isClaimed && (
        <div className="absolute inset-[3px] rounded-full border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
      
      {/* Initials display if claimed and block is large enough */}
      {isClaimed && profile?.username && config.size > 50 && (
         <span className="text-white/90 font-bold text-xs pointer-events-none drop-shadow-md select-none" style={{ fontFamily: "var(--font-outfit)" }}>
            {profile.username.substring(0, 2).toUpperCase()}
         </span>
      )}
    </div>
  );
});

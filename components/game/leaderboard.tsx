"use client";

import { useState } from "react";
import type { BlockData, ProfileData } from "@/hooks/use-grid";
import { useLeaderboard } from "@/hooks/use-leaderboard";

interface LeaderboardProps {
  blocks: Map<number, BlockData>;
  profiles: Map<string, ProfileData>;
  currentUserId: string | null;
}

export function Leaderboard({
  blocks,
  profiles,
  currentUserId,
}: LeaderboardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const entries = useLeaderboard(blocks, profiles);

  if (entries.length === 0) return null;

  return (
    <div className="absolute top-24 sm:top-16 right-2 sm:right-3 z-10 animate-slide-in-right max-w-[calc(100vw-1rem)] sm:max-w-none">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="glass-panel rounded-t-xl px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors w-full text-left flex items-center justify-between"
        style={{ fontFamily: "var(--font-outfit)" }}
      >
        <span>🏆 Leaderboard</span>
        <span className="text-xs text-zinc-500">
          {isExpanded ? "▲" : "▼"}
        </span>
      </button>

      {isExpanded && (
        <div className="glass-panel rounded-b-xl border-t border-zinc-700/30 p-3 min-w-[200px]">
          <div className="flex flex-col gap-1.5">
            {entries.map((entry, index) => (
              <div
                key={entry.userId}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm ${
                  entry.userId === currentUserId
                    ? "bg-white/5 ring-1 ring-white/10"
                    : ""
                }`}
              >
                <span className="text-xs text-zinc-500 w-4 text-right">
                  {index + 1}
                </span>
                <div
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-zinc-300 truncate flex-1">
                  {entry.username}
                  {entry.userId === currentUserId && (
                    <span className="text-zinc-600 text-xs ml-1">(you)</span>
                  )}
                </span>
                <span className="text-xs text-zinc-500 font-mono tabular-nums">
                  {entry.blockCount}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

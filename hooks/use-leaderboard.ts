"use client";

import { useMemo } from "react";
import type { BlockData, ProfileData } from "@/hooks/use-grid";

interface LeaderboardEntry {
  userId: string;
  username: string;
  color: string;
  blockCount: number;
}

export function useLeaderboard(
  blocks: Map<number, BlockData>,
  profiles: Map<string, ProfileData>
): LeaderboardEntry[] {
  return useMemo(() => {
    const counts = new Map<string, number>();

    blocks.forEach((block) => {
      if (block.owner_id) {
        counts.set(block.owner_id, (counts.get(block.owner_id) || 0) + 1);
      }
    });

    const entries: LeaderboardEntry[] = [];
    counts.forEach((count, userId) => {
      const profile = profiles.get(userId);
      entries.push({
        userId,
        username: profile?.username || "Unknown",
        color: profile?.color || "#666",
        blockCount: count,
      });
    });

    return entries.sort((a, b) => b.blockCount - a.blockCount).slice(0, 10);
  }, [blocks, profiles]);
}

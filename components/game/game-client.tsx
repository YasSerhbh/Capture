"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useGrid, type ProfileData } from "@/hooks/use-grid";
import { GameBoard } from "@/components/game/game-board";
import { Navbar } from "@/components/game/navbar";
import { Leaderboard } from "@/components/game/leaderboard";

export function GameClient() {
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const {
    blocks,
    profiles,
    captureBlock,
    unclaimBlock,
    resetMyBlocks,
    cooldownRemaining,
  } = useGrid(userId);

  useEffect(() => {
    const supabase = createClient();

    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUserId(user.id);
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, username, color")
          .eq("id", user.id)
          .single();

        if (profile) setUserProfile(profile);
      }
      setIsLoading(false);
    }
    getUser();
  }, []);

  const userBlockCount = userId
    ? Array.from(blocks.values()).filter((b) => b.owner_id === userId).length
    : 0;

  const canCapture = !!userId && cooldownRemaining <= 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="h-8 w-8 border-2 border-zinc-700 border-t-zinc-300 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-zinc-950 gap-6 animate-fade-in relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.05),transparent_50%)]" />
        <div className="text-center z-10">
          <h1
            className="text-6xl font-black text-white mb-4 tracking-tighter drop-shadow-lg"
            style={{ fontFamily: "var(--font-outfit)" }}
          >
            CAPTURE
          </h1>
          <p className="text-zinc-400 text-lg max-w-sm mx-auto">
            Claim blocks. Control territory. 
          </p>
        </div>
        <div className="flex gap-4 z-10">
          <a
            href="/auth/login"
            className="px-8 py-3 bg-white text-zinc-900 rounded-lg font-bold hover:bg-zinc-200 transition-colors shadow-lg"
          >
            Log In
          </a>
          <a
            href="/auth/sign-up"
            className="px-8 py-3 bg-zinc-900 text-white rounded-lg font-bold hover:bg-zinc-800 transition-colors ring-1 ring-zinc-700 shadow-lg"
          >
            Sign Up
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-zinc-950 overflow-hidden">
      <Navbar
        profile={userProfile}
        cooldownRemaining={cooldownRemaining}
        totalCaptured={userBlockCount}
        onReset={resetMyBlocks}
      />

      <div className="flex-1 relative overflow-hidden">
        <GameBoard
          blocks={blocks}
          profiles={profiles}
          userId={userId}
          onCapture={captureBlock}
          onUnclaim={unclaimBlock}
          canCapture={canCapture}
        />
        <Leaderboard
          blocks={blocks}
          profiles={profiles}
          currentUserId={userId}
        />
      </div>
    </div>
  );
}

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export interface ProfileData {
  id: string;
  username: string;
  color: string;
}

export interface BlockData {
  id: number;
  x: number;
  y: number;
  owner_id: string | null;
  captured_at: string | null;
}

export interface UseGridReturn {
  blocks: Map<number, BlockData>;
  profiles: Map<string, ProfileData>;
  captureBlock: (blockId: number) => Promise<boolean>;
  unclaimBlock: (blockId: number) => Promise<boolean>;
  resetMyBlocks: () => Promise<boolean>;
  cooldownRemaining: number;
  isCapturing: boolean;
}

const COOLDOWN_MS = 1000;

export function useGrid(userId: string | null): UseGridReturn {
  const [blocks, setBlocks] = useState<Map<number, BlockData>>(new Map());
  const [profiles, setProfiles] = useState<Map<string, ProfileData>>(new Map());
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  
  const lastCaptureTimeRef = useRef(0);
  const cooldownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function loadInitialData() {
      const { data: blocksData, error: blocksError } = await supabase
        .from("grid_blocks")
        .select("id, x, y, owner_id, captured_at")
        .order("id")
        .limit(300);

      if (blocksError) {
        console.error("[Capture] Failed to load grid blocks:", blocksError.message);
      }

      if (blocksData && blocksData.length > 0) {
        const blockMap = new Map<number, BlockData>();
        blocksData.forEach((b) => blockMap.set(b.id, b));
        setBlocks(blockMap);

        const ownerIds = [
          ...new Set(
            blocksData
              .map((b) => b.owner_id)
              .filter((id): id is string => id !== null)
          ),
        ];

        if (ownerIds.length > 0) {
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("id, username, color")
            .in("id", ownerIds);

          if (profilesData) {
            const profileMap = new Map<string, ProfileData>();
            profilesData.forEach((p) => profileMap.set(p.id, p));
            setProfiles(profileMap);
          }
        }
      }
    }

    loadInitialData();
  }, []);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("grid-realtime")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "grid_blocks" },
        (payload) => {
          const updated = payload.new as BlockData;

          setBlocks((prev) => {
            const next = new Map(prev);
            next.set(updated.id, updated);
            return next;
          });

          if (updated.owner_id) {
            setProfiles((prev) => {
              if (prev.has(updated.owner_id!)) return prev;

              supabase
                .from("profiles")
                .select("id, username, color")
                .eq("id", updated.owner_id!)
                .single()
                .then(({ data }) => {
                  if (data) {
                    setProfiles((p) => {
                      const next = new Map(p);
                      next.set(data.id, data);
                      return next;
                    });
                  }
                });

              return prev;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  useEffect(() => {
    cooldownIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - lastCaptureTimeRef.current;
      if (elapsed >= COOLDOWN_MS) {
        setCooldownRemaining(0);
      } else {
        setCooldownRemaining(COOLDOWN_MS - elapsed);
      }
    }, 50);

    return () => {
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
      }
    };
  }, []);

  const captureBlock = useCallback(
    async (blockId: number): Promise<boolean> => {
      if (!userId) return false;
      if (isCapturing) return false;
      if (cooldownRemaining > 0) return false;

      const block = blocks.get(blockId);
      if (!block) return false;

      if (block.owner_id === userId) return false;
      if (block.owner_id && block.owner_id !== userId) return false;

      setIsCapturing(true);

      setBlocks((prev) => {
        const next = new Map(prev);
        next.set(blockId, {
          ...block,
          owner_id: userId,
          captured_at: new Date().toISOString(),
        });
        return next;
      });

      try {
        const res = await fetch("/api/capture", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blockId }),
        });

        const responseType = res.headers.get("content-type") || "";
        if (responseType.includes("text/html")) {
          console.error("[Capture] Unexpected HTML response from /api/capture");
          setBlocks((prev) => {
            const next = new Map(prev);
            next.set(blockId, block);
            return next;
          });
          return false;
        }

        if (!res.ok) {
          let apiError = `HTTP ${res.status}`;
          try {
            const json = await res.json();
            if (json?.error) apiError = json.error;
          } catch {
            // ignore parse errors; keep status fallback
          }
          console.error(`[Capture] Capture failed: ${apiError}`);

          setBlocks((prev) => {
            const next = new Map(prev);
            next.set(blockId, block);
            return next;
          });
          return false;
        }

        lastCaptureTimeRef.current = Date.now();
        setCooldownRemaining(COOLDOWN_MS);
        return true;
      } catch {
        setBlocks((prev) => {
          const next = new Map(prev);
          next.set(blockId, block);
          return next;
        });
        return false;
      } finally {
        setIsCapturing(false);
      }
    },
    [userId, blocks, isCapturing, cooldownRemaining]
  );

  const unclaimBlock = useCallback(
    async (blockId: number): Promise<boolean> => {
      if (!userId || isCapturing) return false;

      const block = blocks.get(blockId);
      if (!block || block.owner_id !== userId) return false;

      setIsCapturing(true);

      setBlocks((prev) => {
        const next = new Map(prev);
        next.set(blockId, {
          ...block,
          owner_id: null,
          captured_at: null,
        });
        return next;
      });

      try {
        const res = await fetch("/api/unclaim", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blockId }),
        });

        if (!res.ok) throw new Error("Failed");
        return true;
      } catch {
        setBlocks((prev) => {
          const next = new Map(prev);
          next.set(blockId, block);
          return next;
        });
        return false;
      } finally {
        setIsCapturing(false);
      }
    },
    [userId, blocks, isCapturing]
  );

  const resetMyBlocks = useCallback(async (): Promise<boolean> => {
    if (!userId || isCapturing) return false;

    setIsCapturing(true);
    const previousBlocks = new Map(blocks);
    
    setBlocks((prev) => {
      const next = new Map(prev);
      next.forEach((b, id) => {
        if (b.owner_id === userId) {
          next.set(id, { ...b, owner_id: null, captured_at: null });
        }
      });
      return next;
    });

    try {
      const res = await fetch("/api/reset-mine", { method: "POST" });
      if (!res.ok) throw new Error("Failed to reset");
      return true;
    } catch {
      setBlocks(previousBlocks);
      return false;
    } finally {
      setIsCapturing(false);
    }
  }, [userId, blocks, isCapturing]);

  return {
    blocks,
    profiles,
    captureBlock,
    unclaimBlock,
    resetMyBlocks,
    cooldownRemaining,
    isCapturing,
  };
}

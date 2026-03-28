"use client";

import React, { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { Block } from "@/components/game/block";
import type { BlockData, ProfileData } from "@/hooks/use-grid";

interface GameBoardProps {
  blocks: Map<number, BlockData>;
  profiles: Map<string, ProfileData>;
  userId: string | null;
  onCapture: (blockId: number) => void;
  onUnclaim: (blockId: number) => void;
  canCapture: boolean;
}

const MAX_BLOCKS = 300;
const CANVAS_SIZE = 2000;
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 3;

function getDeterministicConfig(id: number) {
  const seed = id * 1234.5678;
  const x = Math.floor((Math.sin(seed) * 0.5 + 0.5) * (CANVAS_SIZE - 200)) + 100;
  const y = Math.floor((Math.cos(seed * 1.3) * 0.5 + 0.5) * (CANVAS_SIZE - 200)) + 100;
  const radius = Math.floor((Math.sin(seed * 1.7) * 0.5 + 0.5) * 40) + 20; // 20px to 60px radius
  return { x, y, size: radius * 2 };
}

export function GameBoard({
  blocks,
  profiles,
  userId,
  onCapture,
  onUnclaim,
  canCapture,
}: GameBoardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const activePointerId = useRef<number | null>(null);
  const activePointerType = useRef<string | null>(null);
  const dragMoved = useRef(false);
  const suppressClickUntil = useRef(0);
  const pointerTarget = useRef<HTMLDivElement | null>(null);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  useEffect(() => {
    if (containerRef.current) {
      const container = containerRef.current;
      const centerX = (container.clientWidth - CANVAS_SIZE) / 2;
      const centerY = (container.clientHeight - CANVAS_SIZE) / 2;
      setPan({ x: centerX, y: centerY });
    }
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;

    setZoom((prev) => {
      const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev * delta));

      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const cursorX = e.clientX - rect.left;
        const cursorY = e.clientY - rect.top;

        const scale = newZoom / prev;
        setPan((prevPan) => ({
          x: cursorX - (cursorX - prevPan.x) * scale,
          y: cursorY - (cursorY - prevPan.y) * scale,
        }));
      }

      return newZoom;
    });
  }, []);

  const handleZoomButton = useCallback((direction: "in" | "out") => {
    const factor = direction === "in" ? 1.1 : 0.9;

    setZoom((prev) => {
      const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev * factor));

      if (containerRef.current) {
        const container = containerRef.current;
        const centerX = container.clientWidth / 2;
        const centerY = container.clientHeight / 2;
        const scale = newZoom / prev;

        setPan((prevPan) => ({
          x: centerX - (centerX - prevPan.x) * scale,
          y: centerY - (centerY - prevPan.y) * scale,
        }));
      }

      return newZoom;
    });
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (activePointerId.current !== null) return;

      dragMoved.current = false;
      activePointerId.current = e.pointerId;
      activePointerType.current = e.pointerType;
      pointerTarget.current = e.currentTarget;
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        panX: pan.x,
        panY: pan.y,
      };

      // Mobile/pen drag needs immediate capture for stable long drags.
      if (e.pointerType !== "mouse") {
        if (e.cancelable) e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
      }
    },
    [pan]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (activePointerId.current !== e.pointerId) return;

      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      const distance = Math.hypot(dx, dy);
      const dragThreshold = activePointerType.current === "mouse" ? 6 : 2;

      if (!dragMoved.current && distance > dragThreshold) {
        dragMoved.current = true;
        setIsDragging(true);

        const target = pointerTarget.current;
        if (target && !target.hasPointerCapture(e.pointerId)) {
          target.setPointerCapture(e.pointerId);
        }
      }

      if (!dragMoved.current) return;

      if (e.cancelable) {
        e.preventDefault();
      }

      setPan({
        x: dragStart.current.panX + dx,
        y: dragStart.current.panY + dy,
      });
    },
    [isDragging]
  );

  const stopDragging = useCallback((e?: React.PointerEvent<HTMLDivElement>) => {
    if (e && activePointerId.current !== null && activePointerId.current === e.pointerId) {
      const target = pointerTarget.current ?? e.currentTarget;
      if (target.hasPointerCapture(e.pointerId)) {
        target.releasePointerCapture(e.pointerId);
      }
    }

    if (dragMoved.current) {
      suppressClickUntil.current = Date.now() + 180;
    }

    activePointerId.current = null;
    activePointerType.current = null;
    pointerTarget.current = null;
    dragMoved.current = false;
    setIsDragging(false);
  }, []);

  const handleClickCapture = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (Date.now() < suppressClickUntil.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  const blockConfigs = useMemo(() => {
    const configs = [];
    for (let id = 0; id < MAX_BLOCKS; id++) {
      configs.push({ id, ...getDeterministicConfig(id) });
    }
    return configs;
  }, []);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full overflow-hidden relative select-none bg-[#050508]`}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={stopDragging}
      onPointerCancel={stopDragging}
      onLostPointerCapture={stopDragging}
      onClickCapture={handleClickCapture}
      style={{ touchAction: "none" }}
    >
      <div className="absolute top-3 right-3 z-10 glass-panel rounded-lg px-3 py-1.5 text-xs text-zinc-400 font-medium tracking-wide">
        {Math.round(zoom * 100)}%
      </div>

      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => handleZoomButton("out")}
          className="glass-panel h-8 w-8 rounded-md text-zinc-300 text-base leading-none hover:text-white transition-colors"
          aria-label="Zoom out"
        >
          -
        </button>
        <button
          type="button"
          onClick={() => handleZoomButton("in")}
          className="glass-panel h-8 w-8 rounded-md text-zinc-300 text-base leading-none hover:text-white transition-colors"
          aria-label="Zoom in"
        >
          +
        </button>
      </div>

      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, #ffffff 1px, transparent 1px),
            linear-gradient(to bottom, #ffffff 1px, transparent 1px)
          `,
          backgroundSize: `${100 * zoom}px ${100 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      />

      <div
        className="absolute"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "0 0",
          width: CANVAS_SIZE,
          height: CANVAS_SIZE,
          cursor: isDragging ? "grabbing" : "grab",
        }}
      >
        {blockConfigs.map((config) => {
          const block = blocks.get(config.id) || {
            id: config.id,
            x: 0,
            y: 0,
            owner_id: null,
            captured_at: null,
          };
          const profile = block.owner_id
            ? profiles.get(block.owner_id) || null
            : null;

          return (
            <Block
              key={config.id}
              block={block}
              profile={profile}
              config={config}
              isCurrentUser={block.owner_id === userId}
              onCapture={onCapture}
              onUnclaim={onUnclaim}
              canCapture={canCapture}
            />
          );
        })}
      </div>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 glass-panel rounded-full px-3 py-2 sm:px-5 sm:py-2.5 text-[11px] sm:text-xs font-medium text-zinc-400 shadow-2xl border border-white/5 tracking-wide backdrop-blur-md whitespace-nowrap">
        Use +/- or scroll to zoom · Drag to pan
      </div>
    </div>
  );
}

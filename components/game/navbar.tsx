"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { ProfileData } from "@/hooks/use-grid";
import { Logo } from "@/components/ui/logo";

interface NavbarProps {
  profile: ProfileData | null;
  cooldownRemaining: number;
  totalCaptured: number;
  onReset: () => void;
}

export function Navbar({
  profile,
  cooldownRemaining,
  totalCaptured,
  onReset,
}: NavbarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  const cooldownPercent = Math.max(0, (cooldownRemaining / 1000) * 100);

  return (
    <nav className="w-full glass-panel z-20 relative border-b border-white/5 px-3 py-2 sm:h-16 sm:px-6 sm:py-0">
      <div className="flex items-center justify-between gap-2 sm:h-full">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4 group cursor-pointer">
          <Logo className="shrink-0 transition-transform group-hover:scale-110" />
          <h1
            className="text-base sm:text-xl font-black tracking-tighter truncate"
            style={{ fontFamily: "var(--font-outfit)" }}
          >
            <span className="text-white">CAPTURE</span>
          </h1>
        </div>

        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          {profile && (
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 bg-zinc-900/80 rounded-lg shadow-sm border border-zinc-800/50">
                <span className="text-xs text-zinc-300 font-medium">{totalCaptured}</span>
                {totalCaptured > 0 && (
                  <button
                    onClick={onReset}
                    className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 hover:text-red-400 transition-colors ml-1.5 pl-1.5 sm:ml-2 sm:pl-2 border-l border-zinc-700/50"
                    title="Release all your blocks"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div
                className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-full ring-2 ring-zinc-800 shadow-sm shrink-0"
                style={{ backgroundColor: profile.color }}
              />
              <span
                className="max-w-20 sm:max-w-36 truncate text-xs sm:text-sm font-bold text-zinc-100"
                style={{ fontFamily: "var(--font-outfit)" }}
              >
                {profile.username}
              </span>
            </div>
          )}
          <div className="hidden sm:block h-6 w-px bg-zinc-800 mx-1" />
          <button
            onClick={handleLogout}
            className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-500 hover:text-zinc-200 transition-colors px-2 py-1.5 sm:px-3 rounded-md hover:bg-zinc-800/50"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2 sm:mt-0 sm:absolute sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:gap-3">
        <div className="h-1.5 flex-1 sm:flex-none sm:w-40 bg-zinc-800 rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full rounded-full transition-all duration-75 ease-linear"
            style={{
              width: `${100 - cooldownPercent}%`,
              backgroundColor: cooldownPercent > 0 ? "#F59E0B" : "#10B981",
            }}
          />
        </div>
        <span className="text-[11px] sm:text-xs font-medium text-zinc-500 w-11 text-right shrink-0">
          {cooldownPercent > 0 ? `${(cooldownRemaining / 1000).toFixed(1)}s` : "Ready"}
        </span>
      </div>
    </nav>
  );
}

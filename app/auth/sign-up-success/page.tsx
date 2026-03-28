import Link from "next/link";

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6">
      <div className="w-full max-w-md animate-fade-in text-center">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 backdrop-blur-sm p-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20">
            <svg
              className="h-7 w-7 text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h1
            className="text-2xl font-bold text-white mb-2"
            style={{ fontFamily: "var(--font-outfit)" }}
          >
            Check your email
          </h1>
          <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
            We&apos;ve sent you a verification link. Click it to activate your
            account and start capturing blocks on the grid.
          </p>
          <div className="rounded-lg bg-zinc-900/50 border border-zinc-800 px-4 py-3 text-xs text-zinc-500 mb-6">
            💡 Didn&apos;t get it? Check your spam folder or try signing up
            again.
          </div>
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center rounded-lg bg-white text-zinc-900 px-6 py-2.5 text-sm font-medium hover:bg-zinc-200 transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

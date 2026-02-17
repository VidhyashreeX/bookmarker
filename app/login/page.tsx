"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect } from "react";

export default function LoginPage() {
  useEffect(() => {
    const run = async () => {
      const supabase = createClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (user) {
        window.location.href = "/";
      }
    };

    run();
  }, []);

  const handleLogin = async () => {
    const supabase = createClient();

    const redirectTo = `${window.location.origin}/auth/callback`;

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo
      }
    });
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6">
      <h1 className="text-3xl font-bold">Smart Bookmark</h1>
      <p className="mt-3 text-center text-slate-600">
        Sign in with Google to manage private bookmarks in realtime.
      </p>
      <button
        onClick={handleLogin}
        className="mt-8 rounded-lg bg-slate-900 px-5 py-3 text-white transition hover:bg-slate-700"
      >
        Continue with Google
      </button>
    </main>
  );
}

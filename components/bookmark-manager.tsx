"use client";

import { createClient } from "@/lib/supabase/client";
import { useCallback, useMemo, useState, useEffect } from "react";

type Bookmark = {
  id: string;
  title: string;
  url: string;
  created_at: string;
  user_id: string;
};

type Props = {
  userId: string;
  initialBookmarks: Bookmark[];
};

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

function BookmarkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 6h18" />
      <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
      <path d="M19 6l-1 14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

export default function BookmarkManager({ userId, initialBookmarks }: Props) {
  const PAGE_SIZE = 10;
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [currentPage, setCurrentPage] = useState(1);

  const supabase = useMemo(() => createClient(), []);

  const fetchBookmarks = useCallback(async () => {
    const { data } = await supabase
      .from("bookmarks")
      .select("id,title,url,created_at,user_id")
      .order("created_at", { ascending: false });

    setBookmarks(data ?? []);
  }, [supabase]);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextTheme =
      savedTheme === "dark" || savedTheme === "light"
        ? savedTheme
        : prefersDark
          ? "dark"
          : "light";

    setTheme(nextTheme);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const channel = supabase
      .channel(`bookmarks-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookmarks",
          filter: `user_id=eq.${userId}`
        },
        () => {
          fetchBookmarks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchBookmarks, supabase, userId]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(bookmarks.length / PAGE_SIZE));
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [bookmarks, currentPage, PAGE_SIZE]);

  const addBookmark = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!title.trim() || !url.trim()) {
      setErrorMessage("Please enter both title and URL.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("bookmarks").insert({
      user_id: userId,
      title: title.trim(),
      url: url.trim()
    });

    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setTitle("");
    setUrl("");
    setCurrentPage(1);
  };

  const deleteBookmark = async (id: string) => {
    await supabase.from("bookmarks").delete().eq("id", id);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const totalPages = Math.max(1, Math.ceil(bookmarks.length / PAGE_SIZE));
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const visibleBookmarks = bookmarks.slice(startIndex, startIndex + PAGE_SIZE);
  const toggleTheme = () => setTheme((prev) => (prev === "light" ? "dark" : "light"));

  return (
    <div className="relative mx-auto min-h-screen w-full max-w-3xl px-4 py-8 sm:px-6">
      <div className="app-bg" aria-hidden>
        <div className="blob blob-one" />
        <div className="blob blob-two" />
        <div className="blob blob-three" />
      </div>

      <div className="sticky top-4 z-20 mb-6">
        <button
          onClick={toggleTheme}
          className="glass-card absolute left-0 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-700 shadow-lg shadow-slate-900/10 transition hover:bg-white/80 active:scale-95 dark:text-slate-100 dark:hover:bg-slate-800/70"
          title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
          aria-label="Toggle theme"
        >
          {theme === "light" ? <MoonIcon /> : <SunIcon />}
        </button>
        <div className="glass-card mx-12 rounded-2xl px-4 py-3 text-center shadow-lg shadow-slate-900/10 fade-in">
          <h1 className="text-xl font-bold sm:text-2xl">My Bookmarks</h1>
        </div>
        <button
          onClick={logout}
          className="glass-card absolute right-0 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-700 shadow-lg shadow-slate-900/10 transition hover:bg-white/80 active:scale-95 dark:text-slate-100 dark:hover:bg-slate-800/70"
          title="Log out"
          aria-label="Log out"
        >
          <LogoutIcon />
        </button>
      </div>

      <form onSubmit={addBookmark} className="glass-card mb-6 grid gap-3 rounded-2xl p-4 shadow-lg shadow-slate-900/10 fade-in">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="rounded-xl border border-slate-300/80 bg-white/85 px-3 py-2 outline-none transition focus:border-sky-400 dark:border-slate-700 dark:bg-slate-950/80"
          required
        />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          type="url"
          className="rounded-xl border border-slate-300/80 bg-white/85 px-3 py-2 outline-none transition focus:border-sky-400 dark:border-slate-700 dark:bg-slate-950/80"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-slate-900 px-4 py-2 text-white transition hover:bg-slate-700 active:scale-[0.99] disabled:opacity-50 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-white"
        >
          {loading ? "Adding..." : "Add Bookmark"}
        </button>
        {errorMessage && <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>}
      </form>

      <div className="mb-4 flex items-center justify-between text-sm text-slate-700 dark:text-slate-300 fade-in">
        <p>Total bookmarks: {bookmarks.length}</p>
        <p>
          Page {currentPage} of {totalPages} (showing up to {PAGE_SIZE})
        </p>
      </div>

      <ul className="space-y-3">
        {visibleBookmarks.map((bookmark, index) => (
          <li
            key={bookmark.id}
            className="glass-card fade-in flex items-center justify-between rounded-2xl p-4 shadow-md shadow-slate-900/5"
            style={{ animationDelay: `${index * 35}ms` }}
          >
            <div className="min-w-0">
              <p className="mb-1 flex items-center gap-2 truncate font-semibold">
                <BookmarkIcon />
                <span className="truncate">{bookmark.title}</span>
              </p>
              <a
                href={bookmark.url}
                target="_blank"
                rel="noreferrer"
                className="block truncate text-sm text-sky-700 underline dark:text-sky-400"
              >
                {bookmark.url}
              </a>
            </div>
            <button
              onClick={() => deleteBookmark(bookmark.id)}
              className="ml-3 rounded-lg border border-red-300 bg-red-50/80 p-2 text-red-700 transition hover:bg-red-100 active:scale-95 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
              title="Delete bookmark"
              aria-label="Delete bookmark"
            >
              <TrashIcon />
            </button>
          </li>
        ))}
      </ul>

      {bookmarks.length > PAGE_SIZE && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={currentPage === 1}
            className="glass-card rounded-xl px-3 py-2 text-sm transition hover:bg-white/80 disabled:opacity-50 dark:hover:bg-slate-800/70"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            disabled={currentPage === totalPages}
            className="glass-card rounded-xl px-3 py-2 text-sm transition hover:bg-white/80 disabled:opacity-50 dark:hover:bg-slate-800/70"
          >
            Next
          </button>
        </div>
      )}

      {bookmarks.length === 0 && (
        <div className="glass-card fade-in mt-8 rounded-2xl p-8 text-center shadow-lg shadow-slate-900/10">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-sky-700 dark:bg-slate-800 dark:text-sky-300">
            <BookmarkIcon />
          </div>
          <p className="font-semibold">No bookmarks yet</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Save your first link above and it will appear here instantly.
          </p>
        </div>
      )}
    </div>
  );
}

import BookmarkManager from "@/components/bookmark-manager";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: bookmarks } = await supabase
    .from("bookmarks")
    .select("id,title,url,created_at,user_id")
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen">
      <BookmarkManager userId={user.id} initialBookmarks={bookmarks ?? []} />
    </main>
  );
}

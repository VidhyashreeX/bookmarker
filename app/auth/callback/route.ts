import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const authError = searchParams.get("error");
  const authErrorDescription = searchParams.get("error_description");

  if (authError) {
    console.error("OAuth provider returned an error.", {
      authError,
      authErrorDescription
    });
    return NextResponse.redirect(`${origin}/login?error=oauth_provider`);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("Failed to exchange OAuth code for session.", error);
      return NextResponse.redirect(`${origin}/login?error=exchange_failed`);
    }
  } else {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  return NextResponse.redirect(`${origin}/`);
}

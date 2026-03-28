import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Release all blocks owned by the user
    // RLS will ensure they only update blocks they previously owned,
    // though this where clause does the same
    const { error: updateError } = await supabase
      .from("grid_blocks")
      .update({
        owner_id: null,
        captured_at: null,
      })
      .eq("owner_id", user.id);

    if (updateError) {
      console.error("Reset error:", updateError);
      return NextResponse.json(
        { error: "Failed to reset blocks" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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

    let body: { blockId: number };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    if (typeof body.blockId !== "number" || body.blockId < 0 || body.blockId >= 300) {
      return NextResponse.json(
        { error: "Invalid blockId" },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: block } = await supabase
      .from("grid_blocks")
      .select("owner_id")
      .eq("id", body.blockId)
      .single();

    if (!block || block.owner_id !== user.id) {
      return NextResponse.json(
        { error: "You don't own this block" },
        { status: 403 }
      );
    }

    // Unclaim the block
    const { error: updateError } = await supabase
      .from("grid_blocks")
      .update({
        owner_id: null,
        captured_at: null,
      })
      .eq("id", body.blockId);

    if (updateError) {
      console.error("Unclaim error:", updateError);
      return NextResponse.json(
        { error: "Failed to unclaim block" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, blockId: body.blockId });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

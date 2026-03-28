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
        { error: "Invalid blockId. Must be 0-299." },
        { status: 400 }
      );
    }

    const { data: lastCapture } = await supabase
      .from("grid_blocks")
      .select("captured_at")
      .eq("owner_id", user.id)
      .order("captured_at", { ascending: false })
      .limit(1)
      .single();

    if (lastCapture?.captured_at) {
      const timeSince =
        Date.now() - new Date(lastCapture.captured_at).getTime();
      if (timeSince < 1000) {
        return NextResponse.json(
          {
            error: "Cooldown active",
            retryAfter: Math.ceil((1000 - timeSince) / 1000),
          },
          { status: 429 }
        );
      }
    }

    const { data: block } = await supabase
      .from("grid_blocks")
      .select("owner_id")
      .eq("id", body.blockId)
      .single();

    if (!block) {
      return NextResponse.json(
        { error: "Block not found" },
        { status: 404 }
      );
    }

    if (block.owner_id && block.owner_id !== user.id) {
      return NextResponse.json(
        { error: "Block already claimed by another player" },
        { status: 409 }
      );
    }

    const { data: updatedBlock, error: updateError } = await supabase
      .from("grid_blocks")
      .update({
        owner_id: user.id,
        captured_at: new Date().toISOString(),
      })
      .eq("id", body.blockId)
      .is("owner_id", null)
      .select("id")
      .maybeSingle();

    if (updateError) {
      console.error("Capture error:", updateError);
      return NextResponse.json(
        { error: "Failed to capture block" },
        { status: 500 }
      );
    }

    if (!updatedBlock) {
      return NextResponse.json(
        { error: "Block is no longer available" },
        { status: 409 }
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

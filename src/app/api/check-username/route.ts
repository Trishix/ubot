import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const username = searchParams.get("username")?.toLowerCase();
        const userId = searchParams.get("userId"); // The ID of the person making the request

        if (!username) {
            return NextResponse.json({ available: false });
        }

        // Check if username exists
        const { data: existing, error } = await supabaseAdmin
            .from("profiles")
            .select("user_id")
            .eq("username", username)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        // If it doesn't exist, it's available
        if (!existing) {
            return NextResponse.json({ available: true });
        }

        // If it exists, it's available ONLY if it belongs to the current user (editing)
        const available = existing.user_id === userId;

        return NextResponse.json({ available });

    } catch (error) {
        console.error("Username Check Error:", error);
        return NextResponse.json({ error: "Check failed" }, { status: 500 });
    }
}

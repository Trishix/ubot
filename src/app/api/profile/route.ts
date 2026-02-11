import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: profile, error } = await supabaseAdmin
            .from("profiles")
            .select("*")
            .eq("user_id", userId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is 'no rows found'
            throw error;
        }

        return NextResponse.json({ profile: profile || null });
    } catch (error) {
        console.error("Profile Fetch Error:", error);
        return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { error } = await supabaseAdmin
            .from("profiles")
            .delete()
            .eq("user_id", userId);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Profile Delete Error:", error);
        return NextResponse.json({ error: "Failed to delete profile" }, { status: 500 });
    }
}

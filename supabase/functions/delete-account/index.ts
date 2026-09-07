// Deletes the calling user's account entirely: uploaded images, posts,
// reports, profile row, and the auth.users record itself. Must run
// server-side (Edge Function) because deleting an auth user requires the
// service_role key, which the mobile app is never given.
//
// SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are provided
// automatically to every Edge Function by Supabase — no manual secrets to set.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Identify the caller from their own access token (never trust a
    // client-supplied user id).
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await callerClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid or expired session" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);

    // Clean up their uploaded images from storage. (profiles/posts/
    // post_reports rows are removed automatically via ON DELETE CASCADE
    // once the auth user is deleted below.)
    const { data: posts } = await admin
      .from("posts")
      .select("image_url")
      .eq("author_id", user.id);

    const paths = (posts ?? [])
      .map((p) => p.image_url as string | null)
      .filter((url): url is string => !!url)
      .map((url) => {
        const marker = "/post-images/";
        const idx = url.indexOf(marker);
        return idx === -1 ? null : url.slice(idx + marker.length);
      })
      .filter((p): p is string => !!p);

    if (paths.length > 0) {
      await admin.storage.from("post-images").remove(paths);
    }

    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) {
      return new Response(JSON.stringify({ error: deleteError.message }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});

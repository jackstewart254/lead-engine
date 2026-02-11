import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TRANSPARENT_PIXEL = Uint8Array.from(
  atob(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
  ),
  (c) => c.charCodeAt(0)
);

function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const id = url.searchParams.get("id");

  if (!type || !id) {
    return new Response("Missing params", { status: 400 });
  }

  const supabase = getSupabase();

  if (type === "open") {
    // Atomic: increment open_count, set opened=true, set opened_at on first open
    await supabase.rpc("record_email_open", { email_id: id });

    return new Response(TRANSPARENT_PIXEL, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
  }

  if (type === "click") {
    const dest = url.searchParams.get("url");
    if (!dest) {
      return new Response("Missing url param", { status: 400 });
    }

    // Set clicked=true and clicked_at on first click
    await supabase
      .from("emails_sent")
      .update({
        clicked: true,
        clicked_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("clicked", false);

    return Response.redirect(dest, 302);
  }

  return new Response("Unknown type", { status: 400 });
});

"use client";
import { useEffect, useRef, useState } from "react";
import { getSupabase } from "../../../lib/supabase";
import { pendingWork, persistWork } from "../../../lib/saved-work";

export default function Callback() {
  const started = useRef(false);
  const userId = useRef<string | null>(null);
  const saveId = useRef<string | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(false);
  async function finishSave() {
    setError(""); setRetry(false);
    try {
      const work = pendingWork(saveId.current);
      if (work && userId.current) await persistWork(work, userId.current);
      if (saveId.current && !work) {
        // A replay may already have saved it; check the signed-in account before claiming success.
        const { data, error } = await getSupabase().from("workflow_runs").select("id").eq("id", saveId.current).eq("user_id", userId.current!).maybeSingle();
        if (error || !data) throw new Error("Sign-in succeeded, but this browser has no recovery copy. Return to the original browser and save your result there.");
      }
      try { localStorage.removeItem("afe:first-use:v1"); } catch {}
      window.location.replace("/work");
    } catch (e) { setError(e instanceof Error ? e.message : "Saving failed. Your recovery copy has been kept."); setRetry(true); }
  }
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void (async () => {
      try {
        const params = new URLSearchParams(location.search);
        const fragment = new URLSearchParams(location.hash.slice(1));
        saveId.current = params.get("save");
        const code = params.get("code") || fragment.get("code");
        const tokenHash = params.get("token_hash");
        const type = params.get("type");
        const accessToken = fragment.get("access_token");
        const refreshToken = fragment.get("refresh_token");
        // Capture save first and remove credentials before any network request.
        history.replaceState(null, "", `/auth/callback${saveId.current ? `?save=${encodeURIComponent(saveId.current)}` : ""}`);
        if (params.has("error") || fragment.has("error")) {
          const expired = (params.get("error_code") || fragment.get("error_code")) === "otp_expired";
          throw new Error(expired ? "This email link has expired or has already been used. Your result is still safe. Return to your result and request a new email." : "Sign-in was cancelled or the link is invalid. Return to your result and try again.");
        }
        if ((tokenHash && (type !== "email" || code || accessToken || refreshToken)) || (code && (accessToken || refreshToken)) || (!!accessToken !== !!refreshToken)) throw new Error("Sign-in was cancelled or the link is invalid. Return to your result and try again.");
        const sb = getSupabase();
        // Default ConfirmationURL verifies at Supabase first and returns PKCE code.
        // Also accept a complete implicit session from default confirmation flows.
        const authResult = tokenHash
          ? await sb.auth.verifyOtp({ token_hash: tokenHash, type: "email" })
          : code ? await sb.auth.exchangeCodeForSession(code)
          : accessToken && refreshToken ? await sb.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
          : null;
        if (authResult?.error) throw new Error("This sign-in link expired or was opened in another browser. Return to your result and request a new link.");
        // A reload after successful auth may have no credentials in its URL.
        // Never trust local session data alone, and never fall back after auth errors.
        const { data, error: userError } = await sb.auth.getUser();
        if (userError || !data.user) throw new Error("We could not verify your account. Please sign in again.");
        userId.current = data.user.id;
        await finishSave();
      } catch (e) { setError(e instanceof Error ? e.message : "Sign-in failed. Your original result has been kept."); }
    })();
  }, []);
  return <main className="mx-auto max-w-xl p-6"><h1 className="text-3xl font-semibold">Finishing sign-in</h1>{error ? <p role="alert" className="mt-5">{error}</p> : <p role="status" className="mt-5">Keeping your work safe…</p>}{retry && <button className="mt-4 min-h-12 rounded-xl border p-3" onClick={finishSave}>Retry saving</button>}<div className="mt-6 flex gap-6"><a href={saveId.current ? `/start?recover=${encodeURIComponent(saveId.current)}` : "/start"} className="underline">Return to my result</a><a href="/work" className="underline">Recent Work</a></div></main>;
}

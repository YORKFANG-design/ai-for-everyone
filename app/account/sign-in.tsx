"use client";
import { useState, type FormEvent } from "react";
import { getSupabase } from "../../lib/supabase";

export default function SignIn({ saveId }: { saveId?: string }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  // Always include a query parameter so Email Templates can append &token_hash safely.
  const callback = () => `${location.origin}/auth/callback?save=${encodeURIComponent(saveId ?? "")}`;
  async function google() {
    setBusy(true); setError("");
    try {
      const { error } = await getSupabase().auth.signInWithOAuth({ provider: "google", options: { redirectTo: callback() } });
      if (error) throw error;
    } catch { setError("Google sign-in could not start. Your result is still safe here. Please retry."); }
    finally { setBusy(false); }
  }
  async function sendEmail(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      const { error } = await getSupabase().auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: callback() } });
      if (error) throw error;
      setMessage("Check your email. Open the sign-in link in this browser on this device to finish saving.");
    } catch { setError("We could not send the sign-in link. Check your email address and try again shortly."); }
    finally { setBusy(false); }
  }
  return <section aria-label="Sign in" className="mt-6 rounded-2xl border border-neutral-300 bg-white p-5">
    <h2 className="text-xl font-semibold">Sign in to keep your work</h2>
    <p className="mt-2 text-sm leading-6">Create an account or return to an existing one. {saveId && "Your result has been kept on this device while you sign in."}</p>
    <button disabled={busy} onClick={google} className="mt-4 min-h-12 w-full rounded-xl border p-3 font-semibold">Continue with Google</button>
    <form onSubmit={sendEmail} className="mt-4 space-y-3"><label htmlFor="sign-in-email" className="block text-sm font-semibold">Email</label><input id="sign-in-email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} className="min-h-12 w-full rounded-xl border p-3" /><button disabled={busy} className="min-h-12 w-full rounded-xl bg-neutral-950 p-3 font-semibold text-white">{busy ? "Please wait…" : "Email me a sign-in link"}</button></form>
    {message && <p role="status" className="mt-3 text-sm">{message}</p>}{error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
  </section>;
}

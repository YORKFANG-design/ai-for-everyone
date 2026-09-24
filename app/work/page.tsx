"use client";
import { useEffect, useRef, useState } from "react";
import SignIn from "../account/sign-in";
import { getSupabase } from "../../lib/supabase";
import { parseWork, type SavedWork } from "../../lib/saved-work";
import { tasks } from "../../lib/first-use";

type Row = SavedWork & { updated_at: string };
export default function Work() {
  const [rows, setRows] = useState<Row[]>([]);
  const [user, setUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const revision = useRef(0);
  async function load() {
    const current = ++revision.current;
    setLoading(true); setError(""); setRows([]);
    try {
      const sb = getSupabase();
      const { data: auth, error: authError } = await sb.auth.getUser();
      if (current !== revision.current) return;
      setUser(auth.user?.id ?? null);
      if (authError && authError.name !== "AuthSessionMissingError") throw new Error("We could not verify your account. Please retry.");
      if (!auth.user) return;
      const { data, error } = await sb.from("workflow_runs").select("id,request,result,updated_at").eq("user_id", auth.user.id).order("updated_at", { ascending: false }).limit(50);
      if (current !== revision.current) return;
      if (error) throw new Error("We could not load your saved work. Please retry.");
      setRows((data ?? []).flatMap(row => { const work = parseWork({ ...row, version: 1 }); return work ? [{ ...work, updated_at: row.updated_at }] : []; }));
    } catch (e) { if (current === revision.current) setError(e instanceof Error ? e.message : "Could not load your work."); }
    finally { if (current === revision.current) setLoading(false); }
  }
  useEffect(() => {
    void load();
    try {
      const { data } = getSupabase().auth.onAuthStateChange((event) => {
        if (event === "SIGNED_OUT" || event === "SIGNED_IN") {
          revision.current++;
          setRows([]); setUser(null);
          // Do not await Supabase calls inside its auth callback lock.
          setTimeout(() => void load(), 0);
        }
      });
      return () => { revision.current++; data.subscription.unsubscribe(); };
    } catch { /* load() reports configuration failures. */ }
  }, []);
  async function signOut() {
    try {
      const { error } = await getSupabase().auth.signOut();
      if (error) throw error;
      setRows([]); setUser(null);
      localStorage.removeItem("afe:first-use:v1");
    } catch { setError("Sign-out failed. Please retry before leaving this device."); }
  }
  return <main className="mx-auto min-h-screen max-w-3xl px-5 py-10"><header className="flex flex-wrap justify-between gap-4"><a href="/start" className="underline">Create a result</a>{user && <button onClick={signOut} className="min-h-11 underline">Sign out</button>}</header><h1 className="mt-8 text-4xl font-semibold">Recent Work</h1><h2 className="mt-3 text-xl">Saved Workflows</h2><p className="mt-2 text-sm text-neutral-600">Your latest 50 saved results, with their original requests and edits.</p>
    {loading ? <p role="status" className="mt-6">Loading your work…</p> : error ? <div className="mt-6"><p role="alert">{error}</p><button onClick={load} className="mt-3 min-h-12 rounded-xl border p-3">Retry</button></div> : !user ? <SignIn /> : rows.length === 0 ? <p className="mt-6">No saved workflows yet. Create a result, then choose Save workflow.</p> : <ul className="mt-6 space-y-4">{rows.map(row => <li key={row.id} className="rounded-2xl border p-5"><h3 className="font-semibold">{tasks.find(task => task.id === row.request.task)?.title}</h3><p className="mt-2 line-clamp-3 whitespace-pre-wrap break-words">{row.request.input}</p><p className="mt-3 text-xs text-neutral-600">Saved {new Date(row.updated_at).toLocaleString()}</p><a href={`/start?work=${row.id}`} className="mt-3 inline-block min-h-11 py-3 font-semibold underline">Open / reuse workflow</a></li>)}</ul>}
  </main>;
}

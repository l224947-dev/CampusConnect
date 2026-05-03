import Layout from "../../components/Layout";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient";
import { classAccentFromId, dicebearBgHex } from "../../lib/classAccent";

export default function Dashboard() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const { data, error: qErr } = await supabase
      .from("subjects")
      .select(
        `
        id,
        name,
        teacher:profiles!subjects_teacher_id_fkey!inner (
          id,
          full_name,
          email
        )
      `
      )
      .order("name");

    if (qErr) {
      setError(qErr.message);
      setClasses([]);
    } else {
      setClasses(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") {
        load();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [load]);

  return (
    <Layout>
      <div className="mx-auto max-w-7xl">
        <header className="mb-10 md:mb-12">
          <h1 className="text-4xl font-black tracking-tight text-slate-900">
            My classes
          </h1>
          <p className="mt-2 max-w-2xl font-medium text-slate-500">
            Browse subjects, open a class, and book a session with that
            teacher.
          </p>
        </header>

        {error ? (
          <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : null}
        {loading ? (
          <p className="font-medium text-slate-400">Loading classes…</p>
        ) : null}

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
          {classes.map((c) => {
            const t = c.teacher;
            if (!t?.id) return null;
            const accent = classAccentFromId(c.id);
            const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(t.id)}&backgroundColor=${dicebearBgHex(c.id)}`;
            return (
              <article
                key={c.id}
                className="cc-glass cc-glass-hover group flex h-full cursor-pointer flex-col overflow-hidden"
                onClick={() => navigate(`/book/${t.id}/${c.id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    navigate(`/book/${t.id}/${c.id}`);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div
                  className="h-1.5 w-full shrink-0"
                  style={{ background: accent.gradient }}
                  aria-hidden
                />
                <div className="flex flex-1 flex-col p-8">
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 p-2">
                    <img src={avatarUrl} alt="" className="h-12 w-12" />
                  </div>
                  <h2 className="mb-1 text-2xl font-black capitalize text-slate-900">
                    {c.name}
                  </h2>
                  <p className="text-sm font-bold text-indigo-600">
                    {t.full_name || "Teacher"}
                  </p>
                  <p className="mb-8 text-xs font-medium text-slate-400">
                    {t.email}
                  </p>
                  <span className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-black text-white transition-colors group-hover:bg-indigo-600">
                    Open class
                    <i className="fas fa-arrow-right text-[10px]" aria-hidden />
                  </span>
                </div>
              </article>
            );
          })}
        </div>

        {!loading && classes.length === 0 && !error ? (
          <div className="cc-glass mt-8 p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-2xl text-indigo-400">
              <i className="fas fa-sparkles" aria-hidden />
            </div>
            <p className="font-bold text-slate-500">
              No classes yet. When teachers add subjects, they will show up
              here.
            </p>
          </div>
        ) : null}
      </div>
    </Layout>
  );
}

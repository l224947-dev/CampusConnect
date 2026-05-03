import Layout from "../../components/Layout";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import { dicebearBgHex } from "../../lib/classAccent";

function formatRange(startsAt, endsAt) {
  if (!startsAt || !endsAt) return "";
  const s = new Date(startsAt);
  const e = new Date(endsAt);
  return `${s.toLocaleString()} – ${e.toLocaleTimeString()}`;
}

function subjectLabel(row) {
  return (
    row.subjects?.name ||
    row.time_slots?.subjects?.name ||
    "—"
  );
}

export default function Profile() {
  const { profile } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    if (!profile?.id) {
      setRows([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    if (profile.role === "student") {
      const { data, error: qErr } = await supabase
        .from("bookings")
        .select(
          `
          id,
          created_at,
          time_slots ( starts_at, ends_at, subjects ( name ) ),
          teacher:profiles!bookings_teacher_id_fkey ( id, full_name, email ),
          subjects ( name )
        `
        )
        .eq("student_id", profile.id)
        .order("created_at", { ascending: false });

      if (qErr) {
        setError(qErr.message);
        setRows([]);
      } else {
        const list = data || [];
        setRows(
          list.filter(
            (r) =>
              r.time_slots &&
              r.time_slots.starts_at &&
              r.time_slots.ends_at
          )
        );
      }
    } else {
      const { data, error: qErr } = await supabase
        .from("bookings")
        .select(
          `
          id,
          created_at,
          time_slots ( starts_at, ends_at, subjects ( name ) ),
          student:profiles!bookings_student_id_fkey ( id, full_name, email ),
          subjects ( name )
        `
        )
        .eq("teacher_id", profile.id)
        .order("created_at", { ascending: false });

      if (qErr) {
        setError(qErr.message);
        setRows([]);
      } else {
        const list = data || [];
        setRows(
          list.filter(
            (r) =>
              r.time_slots &&
              r.time_slots.starts_at &&
              r.time_slots.ends_at
          )
        );
      }
    }

    setLoading(false);
  }, [profile?.id, profile?.role]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible" && profile?.id) {
        load();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [profile?.id, load]);

  const cancelBooking = async (bookingId) => {
    if (!profile?.id) return;
    if (
      !window.confirm(
        "Cancel this booking? The time slot will show as open again for others."
      )
    ) {
      return;
    }
    setBusyId(bookingId);
    const { error: delErr } = await supabase
      .from("bookings")
      .delete()
      .eq("id", bookingId)
      .eq("student_id", profile.id);
    setBusyId(null);
    if (delErr) {
      setError(delErr.message);
      return;
    }
    load();
  };

  const isStudent = profile?.role === "student";
  const meSeed = profile?.id || profile?.email || "me";
  const meAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(meSeed)}&backgroundColor=${dicebearBgHex(meSeed)}`;

  const studentGroups = useMemo(() => {
    if (!isStudent) return [];
    const map = new Map();
    for (const r of rows) {
      const t = r.teacher;
      const key = t?.id || t?.email || "unknown";
      if (!map.has(key)) {
        map.set(key, { teacher: t, bookings: [] });
      }
      map.get(key).bookings.push(r);
    }
    return Array.from(map.values());
  }, [rows, isStudent]);

  const roleLabel =
    profile?.role === "teacher" ? "Head instructor" : "Verified student";

  return (
    <Layout>
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-10 text-4xl font-black tracking-tight text-slate-900">
          {isStudent ? "Your profile" : "Live schedule"}
        </h1>

        <section className="cc-glass mb-12 flex flex-col items-start gap-8 border-l-[12px] border-indigo-600 p-8 sm:flex-row sm:items-center sm:p-10">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[2rem] border-4 border-white bg-indigo-50 shadow-xl">
            <img src={meAvatar} alt="" className="h-16 w-16" />
          </div>
          <div>
            <h2 className="text-3xl font-black capitalize text-slate-900">
              {profile?.full_name || "—"}
            </h2>
            <p className="mb-4 font-medium text-slate-500">
              {profile?.email || "—"}
            </p>
            <span className="cc-pill bg-indigo-600 text-white shadow-lg shadow-indigo-100">
              {roleLabel}
            </span>
          </div>
        </section>

        {error ? (
          <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        {isStudent ? (
          <section>
            <h2 className="mb-8 flex items-center gap-3 text-2xl font-black text-slate-900">
              <i className="fas fa-bookmark text-indigo-600" aria-hidden />
              Your teachers &amp; bookings
            </h2>
            {loading ? (
              <p className="font-medium text-slate-400">Loading…</p>
            ) : studentGroups.length === 0 ? (
              <div className="cc-glass p-12 text-center">
                <p className="font-bold italic text-slate-400">
                  No bookings yet. Join a class from the home page.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-8">
                {studentGroups.map(({ teacher, bookings }) => (
                  <article
                    key={teacher?.id || teacher?.email}
                    className="cc-glass overflow-hidden"
                  >
                    <header className="flex items-center gap-5 border-b border-slate-100 bg-slate-50/60 p-8">
                      <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                        <img
                          src={`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(teacher?.id || teacher?.email || "t")}&backgroundColor=${dicebearBgHex(teacher?.id || teacher?.email)}`}
                          alt=""
                          className="h-10 w-10"
                        />
                      </div>
                      <div>
                        <h3 className="font-black capitalize text-slate-900">
                          {teacher?.full_name || "Teacher"}
                        </h3>
                        <p className="text-xs font-bold text-indigo-600">
                          {teacher?.email}
                        </p>
                      </div>
                    </header>
                    <div className="grid grid-cols-1 gap-4 p-8 sm:grid-cols-2">
                      {bookings.map((r) => (
                        <div
                          key={r.id}
                          className="rounded-2xl border border-slate-100 bg-slate-50/40 p-6"
                        >
                          <p className="mb-2 font-black capitalize text-slate-900">
                            {subjectLabel(r)}
                          </p>
                          <p className="mb-4 text-sm font-bold text-slate-600">
                            {formatRange(
                              r.time_slots?.starts_at,
                              r.time_slots?.ends_at
                            )}
                          </p>
                          <button
                            type="button"
                            className="w-full rounded-xl bg-red-50 py-3 text-xs font-bold uppercase tracking-wide text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
                            disabled={busyId === r.id}
                            onClick={() => cancelBooking(r.id)}
                          >
                            {busyId === r.id ? "Cancelling…" : "Cancel booking"}
                          </button>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : (
          <section>
            <h2 className="mb-8 flex items-center gap-3 text-2xl font-black text-slate-900">
              <i className="fas fa-users text-indigo-600" aria-hidden />
              Students on your schedule
            </h2>
            {loading ? (
              <p className="font-medium text-slate-400">Loading…</p>
            ) : rows.length === 0 ? (
              <div className="cc-glass p-12 text-center">
                <p className="font-bold text-slate-400">No bookings yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {rows.map((r) => (
                  <article
                    key={r.id}
                    className="cc-glass cc-glass-hover flex flex-col overflow-hidden border-l-[10px] border-indigo-600"
                  >
                    <div className="p-6">
                      <div className="mb-6 flex items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50 p-2">
                          <img
                            src={`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(r.student?.id || r.student?.email || "s")}&backgroundColor=${dicebearBgHex(r.student?.id)}`}
                            alt=""
                            className="h-full w-full object-contain"
                          />
                        </div>
                        <div className="min-w-0">
                          <h4 className="truncate text-lg font-black capitalize text-slate-900">
                            {r.student?.full_name ||
                              r.student?.email ||
                              "Student"}
                          </h4>
                          <p className="truncate text-[11px] font-black uppercase tracking-wider text-indigo-600">
                            {subjectLabel(r)}
                          </p>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
                        <div className="mb-2 flex items-center gap-2">
                          <i
                            className="far fa-calendar-alt text-xs text-indigo-400"
                            aria-hidden
                          />
                          <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-900">
                            {new Date(
                              r.time_slots.starts_at
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <i
                            className="far fa-clock text-xs text-indigo-400"
                            aria-hidden
                          />
                          <p className="text-sm font-black text-indigo-900">
                            {formatRange(
                              r.time_slots?.starts_at,
                              r.time_slots?.ends_at
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </Layout>
  );
}

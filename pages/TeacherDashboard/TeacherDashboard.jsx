import { useEffect, useState, useCallback } from "react";
import Layout from "../../components/Layout";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import { classAccentFromId, dicebearBgHex } from "../../lib/classAccent";

function formatRange(startsAt, endsAt) {
  const s = new Date(startsAt);
  const e = new Date(endsAt);
  return `${s.toLocaleString()} – ${e.toLocaleTimeString()}`;
}

export default function TeacherDashboard() {
  const { profile } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [slots, setSlots] = useState([]);
  const [subjectName, setSubjectName] = useState("");
  const [activeSubject, setActiveSubject] = useState(null);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const teacherId = profile?.id;

  const loadData = useCallback(async () => {
    if (!teacherId) return;
    setLoading(true);
    const [subRes, slotRes] = await Promise.all([
      supabase
        .from("subjects")
        .select("id, name, created_at")
        .eq("teacher_id", teacherId)
        .order("created_at", { ascending: false }),
      supabase
        .from("time_slots")
        .select(
          `
          id,
          starts_at,
          ends_at,
          subject_id,
          subjects ( name )
        `
        )
        .eq("teacher_id", teacherId)
        .order("starts_at", { ascending: true }),
    ]);

    if (subRes.error) console.error(subRes.error);
    if (slotRes.error) console.error(slotRes.error);

    const subs = subRes.data || [];
    const sl = slotRes.data || [];
    setSubjects(subs);
    setSlots(sl);

    setActiveSubject((prev) => {
      if (!prev?.id) return prev;
      const still = subs.find((s) => s.id === prev.id);
      return still || null;
    });

    setLoading(false);
  }, [teacherId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible" && teacherId) {
        loadData();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [teacherId, loadData]);

  const slotsForActive = activeSubject
    ? slots.filter((x) => x.subject_id === activeSubject.id)
    : [];

  const addSubject = async () => {
    setMessage("");
    if (!subjectName.trim() || !teacherId) return;
    const { error } = await supabase.from("subjects").insert({
      teacher_id: teacherId,
      name: subjectName.trim(),
    });
    if (error) {
      setMessage(error.message);
      return;
    }
    setSubjectName("");
    loadData();
  };

  const addSlot = async () => {
    setMessage("");
    if (!activeSubject) {
      setMessage("Select a class card first, then add meeting times.");
      return;
    }
    if (!teacherId || !startsAt || !endsAt) {
      setMessage("Choose start and end time.");
      return;
    }
    const startIso = new Date(startsAt).toISOString();
    const endIso = new Date(endsAt).toISOString();
    if (endIso <= startIso) {
      setMessage("End must be after start.");
      return;
    }

    const { error } = await supabase.from("time_slots").insert({
      teacher_id: teacherId,
      starts_at: startIso,
      ends_at: endIso,
      subject_id: activeSubject.id,
    });
    if (error) {
      setMessage(error.message);
      return;
    }
    setStartsAt("");
    setEndsAt("");
    loadData();
  };

  const removeSlot = async (slotId) => {
    setMessage("");
    if (
      !window.confirm(
        "Remove this time slot? Any student booking for it will be cancelled."
      )
    ) {
      return;
    }
    const { error } = await supabase
      .from("time_slots")
      .delete()
      .eq("id", slotId)
      .eq("teacher_id", teacherId);
    if (error) {
      setMessage(error.message);
      return;
    }
    loadData();
  };

  const removeSubject = async (sub) => {
    setMessage("");
    if (
      !window.confirm(
        `Delete class “${sub.name}” and all of its time slots? All bookings for those times will be cancelled.`
      )
    ) {
      return;
    }

    const { error: delSlotsErr } = await supabase
      .from("time_slots")
      .delete()
      .eq("subject_id", sub.id)
      .eq("teacher_id", teacherId);

    if (delSlotsErr) {
      setMessage(delSlotsErr.message);
      return;
    }

    const { error: delSubErr } = await supabase
      .from("subjects")
      .delete()
      .eq("id", sub.id)
      .eq("teacher_id", teacherId);

    if (delSubErr) {
      setMessage(delSubErr.message);
      return;
    }

    if (activeSubject?.id === sub.id) {
      setActiveSubject(null);
    }
    loadData();
  };

  const tAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(teacherId || "t")}&backgroundColor=${dicebearBgHex(teacherId)}`;

  return (
    <Layout>
      <div className="mx-auto max-w-7xl">
        <header className="mb-10">
          <h1 className="text-4xl font-black tracking-tight text-slate-900">
            Class studio
          </h1>
          <p className="mt-2 max-w-2xl font-medium text-slate-500">
            Add a class, then click its card to add office hours for that class
            only.
          </p>
        </header>

        {message ? (
          <div className="mb-6 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
            {message}
          </div>
        ) : null}

        <section className="cc-glass mb-10 flex flex-col items-start gap-8 border-l-[12px] border-indigo-600 p-8 sm:flex-row sm:items-center sm:p-10">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[2rem] border-4 border-white bg-indigo-50 shadow-xl">
            <img src={tAvatar} alt="" className="h-16 w-16" />
          </div>
          <div>
            <h2 className="text-3xl font-black capitalize text-slate-900">
              {profile?.full_name || "Teacher"}
            </h2>
            <p className="mb-4 font-medium text-slate-500">
              {profile?.email || "—"}
            </p>
            <span className="cc-pill bg-indigo-600 text-white">
              Head instructor
            </span>
          </div>
        </section>

        <section className="mb-12 rounded-[1.35rem] bg-gradient-to-br from-indigo-900 via-violet-900 to-fuchsia-900 p-8 text-white shadow-xl shadow-indigo-200/40 sm:p-10">
          <h2 className="mb-6 flex items-center gap-2 text-xl font-bold">
            <i className="fas fa-plus-circle text-fuchsia-300" aria-hidden />
            Create a new class
          </h2>
          <div className="flex flex-col gap-4 sm:flex-row">
            <input
              placeholder="e.g. Data Structures & Algorithms"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              className="min-w-0 flex-1 rounded-2xl border border-white/20 bg-white/10 px-6 py-4 font-bold text-white outline-none transition-all placeholder:text-white/40 focus:ring-4 focus:ring-white/15"
            />
            <button
              type="button"
              onClick={addSubject}
              className="shrink-0 rounded-2xl bg-white px-10 py-4 font-black text-indigo-900 shadow-xl transition-colors hover:bg-indigo-50"
            >
              Add class
            </button>
          </div>
        </section>

        {loading ? (
          <p className="mb-8 font-medium text-slate-400">Loading…</p>
        ) : null}

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          <section className="space-y-6 lg:col-span-1">
            <h2 className="text-xl font-black text-slate-900">Your classes</h2>
            {subjects.length === 0 ? (
              <div className="cc-glass p-8 text-center">
                <p className="font-bold text-slate-400">
                  No classes yet. Create one above.
                </p>
              </div>
            ) : (
              subjects.map((s) => {
                const count = slots.filter((sl) => sl.subject_id === s.id)
                  .length;
                const selected = activeSubject?.id === s.id;
                const accent = classAccentFromId(s.id);
                return (
                  <div
                    key={s.id}
                    className={`cc-glass cursor-pointer overflow-hidden transition-all ${
                      selected
                        ? "ring-2 ring-indigo-500 ring-offset-2"
                        : "cc-glass-hover"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setActiveSubject(selected ? null : s)
                      }
                      className="w-full p-6 text-left"
                    >
                      <div
                        className="mb-4 h-1 w-full rounded-full"
                        style={{ background: accent.gradient }}
                        aria-hidden
                      />
                      <div className="mb-4 flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white p-1 shadow-sm">
                          <img
                            src={`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(s.id)}&backgroundColor=${dicebearBgHex(s.id)}`}
                            alt=""
                            className="h-8 w-8"
                          />
                        </div>
                        <h3 className="font-black capitalize text-slate-900">
                          {s.name}
                        </h3>
                      </div>
                      <p className="text-xs font-bold text-slate-400">
                        {count} active slot{count === 1 ? "" : "s"}
                      </p>
                      <p className="mt-2 text-xs font-bold text-indigo-600">
                        {selected
                          ? "Selected · add times on the right"
                          : "Click to manage times"}
                      </p>
                    </button>
                    <div className="border-t border-slate-100 px-6 pb-4">
                      <button
                        type="button"
                        className="text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSubject(s);
                        }}
                      >
                        Delete class
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </section>

          <section className="lg:col-span-2">
            <div className="cc-glass flex min-h-[420px] flex-col p-8 sm:p-10">
              {!activeSubject ? (
                <div className="my-auto flex flex-col items-center py-12 text-center">
                  <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-slate-50 text-4xl text-slate-200">
                    <i className="fas fa-mouse-pointer" aria-hidden />
                  </div>
                  <h4 className="mb-2 text-xl font-bold text-slate-800">
                    Select a class card
                  </h4>
                  <p className="max-w-sm font-medium text-slate-400">
                    Then add datetime ranges for office hours. Students only see
                    slots for the class they opened.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-3xl font-black capitalize text-indigo-950">
                        {activeSubject.name}
                      </h3>
                      <p className="text-sm font-medium text-slate-400">
                        Add or remove availability for this class.
                      </p>
                    </div>
                  </div>

                  <div className="mb-8 grid gap-4 sm:grid-cols-2">
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400">
                      Starts
                      <input
                        type="datetime-local"
                        value={startsAt}
                        onChange={(e) => setStartsAt(e.target.value)}
                        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 font-bold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                      />
                    </label>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400">
                      Ends
                      <input
                        type="datetime-local"
                        value={endsAt}
                        onChange={(e) => setEndsAt(e.target.value)}
                        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 font-bold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                      />
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={addSlot}
                    className="mb-10 w-full rounded-2xl bg-indigo-600 py-4 font-black text-white shadow-lg shadow-indigo-100 transition-colors hover:bg-indigo-700 sm:w-auto sm:px-10"
                  >
                    <i className="fas fa-clock mr-2" aria-hidden />
                    Add time slot
                  </button>

                  <h4 className="mb-4 text-lg font-black text-slate-900">
                    Scheduled for this class
                  </h4>
                  {slotsForActive.length === 0 ? (
                    <p className="font-medium text-slate-400">
                      No slots yet for this class.
                    </p>
                  ) : (
                    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {slotsForActive.map((sl) => (
                        <li
                          key={sl.id}
                          className="flex items-center justify-between gap-3 rounded-2xl border-2 border-green-100 bg-green-50/80 p-4"
                        >
                          <span className="text-sm font-black text-green-900">
                            {formatRange(sl.starts_at, sl.ends_at)}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeSlot(sl.id)}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition-colors hover:border-red-200 hover:text-red-500"
                            aria-label="Remove slot"
                          >
                            <i className="fas fa-trash-alt" aria-hidden />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}

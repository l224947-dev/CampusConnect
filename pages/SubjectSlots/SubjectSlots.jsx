import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import Layout from "../../components/Layout";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import { bookingErrorInfo } from "../../lib/bookingErrors";
import { dicebearBgHex } from "../../lib/classAccent";

const uuidRe =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function formatRange(startsAt, endsAt) {
  const s = new Date(startsAt);
  const e = new Date(endsAt);
  return `${s.toLocaleString()} – ${e.toLocaleTimeString()}`;
}

export default function SubjectSlots() {
  const { teacherId, subjectId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [teacher, setTeacher] = useState(null);
  const [subject, setSubject] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookingSlotId, setBookingSlotId] = useState(null);
  const [confirmSlot, setConfirmSlot] = useState(null);
  const [notice, setNotice] = useState(null);

  const valid =
    teacherId &&
    subjectId &&
    uuidRe.test(teacherId) &&
    uuidRe.test(subjectId);

  const loadSlots = useCallback(async () => {
    if (!valid) {
      setSlots([]);
      return;
    }
    const { data, error: rpcErr } = await supabase.rpc(
      "subject_slots_with_status",
      {
        p_subject_id: subjectId,
        p_teacher_id: teacherId,
      }
    );

    if (rpcErr) {
      console.error(rpcErr);
      setError(rpcErr.message);
      setSlots([]);
      return;
    }
    setSlots(Array.isArray(data) ? data : []);
    setError("");
  }, [teacherId, subjectId, valid]);

  const load = useCallback(async () => {
    if (!valid) {
      setTeacher(null);
      setSubject(null);
      setSlots([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const { data: sub, error: subErr } = await supabase
      .from("subjects")
      .select("id, name, teacher_id")
      .eq("id", subjectId)
      .eq("teacher_id", teacherId)
      .maybeSingle();

    if (subErr || !sub) {
      setError(subErr?.message || "Class not found.");
      setTeacher(null);
      setSubject(null);
      setSlots([]);
      setLoading(false);
      return;
    }

    setSubject(sub);

    const { data: t, error: tErr } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("id", teacherId)
      .eq("role", "teacher")
      .maybeSingle();

    if (tErr || !t) {
      setError(tErr?.message || "Teacher not found.");
      setLoading(false);
      return;
    }

    setTeacher(t);
    await loadSlots();
    setLoading(false);
  }, [teacherId, subjectId, valid, loadSlots]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible" && valid) {
        loadSlots();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [valid, loadSlots]);

  const bookSlot = async (slot) => {
    if (!profile?.id || !slot || !teacherId) return;
    if (slot.is_booked) return;

    setBookingSlotId(slot.id);
    setError("");
    setNotice(null);

    const { error: insErr } = await supabase.from("bookings").insert({
      slot_id: slot.id,
      student_id: profile.id,
      teacher_id: teacherId,
      subject_id: slot.subject_id || subjectId,
    });

    setBookingSlotId(null);

    if (insErr) {
      setNotice(bookingErrorInfo(insErr));
      await loadSlots();
      return;
    }

    setSlots((prev) =>
      prev.map((s) =>
        s.id === slot.id ? { ...s, is_booked: true } : s
      )
    );
    await loadSlots();
    setConfirmSlot(slot);
    setTimeout(() => {
      setConfirmSlot(null);
      navigate("/dashboard");
    }, 1800);
  };

  if (!valid) {
    return (
      <Layout>
        <div className="mx-auto max-w-lg py-16 text-center">
          <div className="cc-glass p-10">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-2xl text-red-400">
              <i className="fas fa-link-slash" aria-hidden />
            </div>
            <h2 className="text-2xl font-black text-slate-900">Invalid link</h2>
            <p className="mt-2 font-medium text-slate-500">
              Check the URL or return to your dashboard.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(teacherId || "t")}&backgroundColor=${dicebearBgHex(subjectId)}`;

  return (
    <Layout>
      <div className="mx-auto max-w-5xl">
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="mb-8 inline-flex items-center gap-2 font-bold text-slate-500 transition-colors hover:text-indigo-600"
        >
          <i className="fas fa-chevron-left text-xs" aria-hidden />
          Back to all classes
        </button>

        <div className="cc-glass relative mb-10 flex flex-col gap-8 overflow-hidden bg-gradient-to-br from-white to-indigo-50/40 p-8 md:flex-row md:items-center md:justify-between md:p-12">
          <div className="relative z-10 min-w-0 flex-1">
            <p className="mb-2 text-xs font-black uppercase tracking-widest text-indigo-600">
              {teacher?.full_name || "Teacher"} · {subject?.name || "Class"}
            </p>
            <h1 className="mb-4 text-4xl font-black capitalize tracking-tight text-slate-900 md:text-5xl">
              {subject?.name || "…"}
            </h1>
            <p className="flex items-center gap-2 font-medium text-slate-500">
              <i className="fas fa-envelope-open-text text-indigo-400" aria-hidden />
              <span>
                {teacher?.full_name} ({teacher?.email})
              </span>
            </p>
          </div>
          <div className="relative z-10 flex h-44 w-44 shrink-0 items-center justify-center rounded-[2.5rem] border border-indigo-100 bg-white p-4 shadow-2xl">
            <img src={avatarUrl} alt="" className="h-32 w-32" />
          </div>
        </div>

        <section className="cc-glass p-8 sm:p-10">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <h2 className="text-2xl font-black text-slate-900">
              Available time slots
            </h2>
            <div className="flex flex-wrap items-center gap-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-green-600 shadow-lg shadow-green-100" />
                Open
              </span>
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-500 shadow-lg shadow-red-100" />
                Taken
              </span>
            </div>
          </div>

          {error ? (
            <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          ) : null}
          {loading ? (
            <p className="mb-6 font-medium text-slate-400">Loading…</p>
          ) : null}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {slots.map((slot) => {
              const taken = Boolean(slot.is_booked);
              return (
                <div
                  key={slot.id}
                  className={`flex flex-col justify-between gap-4 rounded-3xl border-2 p-6 transition-all ${
                    taken
                      ? "border-red-100 bg-red-50/90"
                      : "border-green-100 bg-green-50/90"
                  }`}
                >
                  <div>
                    <p
                      className={`mb-1 text-[10px] font-black uppercase tracking-widest ${
                        taken ? "text-red-400" : "text-green-600"
                      }`}
                    >
                      {new Date(slot.starts_at).toLocaleDateString()}
                    </p>
                    <p
                      className={`text-lg font-black ${
                        taken ? "text-red-900" : "text-green-900"
                      }`}
                    >
                      {formatRange(slot.starts_at, slot.ends_at)}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={taken || bookingSlotId === slot.id}
                    onClick={() => bookSlot(slot)}
                    className={`w-full rounded-2xl py-3 text-xs font-black uppercase tracking-widest transition-all ${
                      taken
                        ? "cursor-not-allowed border border-red-200 bg-white/50 text-red-300"
                        : "bg-green-600 text-white shadow-xl shadow-green-200/80 hover:bg-green-700 disabled:opacity-60"
                    }`}
                  >
                    {taken
                      ? "Already taken"
                      : bookingSlotId === slot.id
                        ? "Booking…"
                        : "Book session"}
                  </button>
                </div>
              );
            })}
          </div>

          {!loading && slots.length === 0 ? (
            <p className="mt-8 text-center font-medium text-slate-400">
              No times posted for this class yet.
            </p>
          ) : null}
        </section>

        {notice ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
          >
            <div className="cc-glass max-w-md p-8 shadow-2xl">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                <i className="fas fa-exclamation-triangle" aria-hidden />
              </div>
              <h2 className="mb-2 text-xl font-black text-slate-900">
                {notice.title}
              </h2>
              <p className="mb-6 font-medium text-slate-600">{notice.body}</p>
              <button
                type="button"
                onClick={() => setNotice(null)}
                className="w-full rounded-2xl bg-indigo-600 py-3 font-black text-white hover:bg-indigo-700"
              >
                OK
              </button>
            </div>
          </div>
        ) : null}

        {confirmSlot ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="cc-glass max-w-md border border-green-100 p-8 text-center shadow-2xl">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
                <i className="fas fa-check-circle text-2xl" aria-hidden />
              </div>
              <h2 className="mb-2 text-xl font-black text-slate-900">Booked</h2>
              <p className="font-medium text-slate-600">
                <span className="font-black text-slate-900">
                  {subject?.name}
                </span>{" "}
                with {teacher?.full_name} at{" "}
                <span className="font-black text-indigo-700">
                  {formatRange(confirmSlot.starts_at, confirmSlot.ends_at)}
                </span>
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </Layout>
  );
}

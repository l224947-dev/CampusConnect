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

export default function Professor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [teacher, setTeacher] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookingSlotId, setBookingSlotId] = useState(null);
  const [confirmSlot, setConfirmSlot] = useState(null);
  const [notice, setNotice] = useState(null);

  const loadSlots = useCallback(async () => {
    if (!id || !uuidRe.test(id)) {
      setSlots([]);
      return;
    }
    const { data, error: rpcErr } = await supabase.rpc(
      "teacher_slots_with_status",
      { p_teacher_id: id }
    );
    if (rpcErr) {
      console.error(rpcErr);
      setError(rpcErr.message);
      setSlots([]);
      return;
    }
    setSlots(Array.isArray(data) ? data : []);
    setError("");
  }, [id]);

  const loadTeacherAndSlots = useCallback(async () => {
    if (!id || !uuidRe.test(id)) {
      setTeacher(null);
      setSlots([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const { data: t, error: tErr } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("id", id)
      .eq("role", "teacher")
      .maybeSingle();

    if (tErr) {
      setError(tErr.message);
      setTeacher(null);
      setSlots([]);
      setLoading(false);
      return;
    }

    if (!t) {
      setTeacher(null);
      setSlots([]);
      setLoading(false);
      return;
    }

    setTeacher(t);
    await loadSlots();
    setLoading(false);
  }, [id, loadSlots]);

  useEffect(() => {
    loadTeacherAndSlots();
  }, [loadTeacherAndSlots]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible" && id && uuidRe.test(id)) {
        loadSlots();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [id, loadSlots]);

  const bookSlot = async (slot) => {
    if (!profile?.id || !slot) return;
    if (slot.is_booked) return;

    setBookingSlotId(slot.id);
    setError("");
    setNotice(null);

    const { error: insErr } = await supabase.from("bookings").insert({
      slot_id: slot.id,
      student_id: profile.id,
      teacher_id: id,
      subject_id: slot.subject_id,
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
    }, 2200);
  };

  if (!id || !uuidRe.test(id)) {
    return (
      <Layout>
        <div className="mx-auto max-w-lg py-16 text-center">
          <div className="cc-glass p-10">
            <h2 className="text-2xl font-black text-slate-900">
              Invalid teacher link
            </h2>
          </div>
        </div>
      </Layout>
    );
  }

  if (!loading && !teacher) {
    return (
      <Layout>
        <div className="mx-auto max-w-lg py-16 text-center">
          <div className="cc-glass p-10">
            <h2 className="text-2xl font-black text-slate-900">
              Teacher not found
            </h2>
          </div>
        </div>
      </Layout>
    );
  }

  const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(id)}&backgroundColor=${dicebearBgHex(id)}`;

  return (
    <Layout>
      <div className="mx-auto max-w-3xl">
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="mb-8 inline-flex items-center gap-2 font-bold text-slate-500 transition-colors hover:text-indigo-600"
        >
          <i className="fas fa-chevron-left text-xs" aria-hidden />
          Dashboard
        </button>

        <div className="cc-glass mb-10 flex flex-col items-center gap-6 p-10 text-center sm:flex-row sm:text-left">
          <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-[2rem] border-4 border-white bg-indigo-50 shadow-xl">
            <img src={avatarUrl} alt="" className="h-20 w-20" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900">
              {loading ? "…" : teacher?.full_name || "Teacher"}
            </h2>
            <p className="mt-1 font-medium text-indigo-600">{teacher?.email}</p>
          </div>
        </div>

        <section className="cc-glass p-8 sm:p-10">
          <h3 className="mb-2 text-2xl font-black text-slate-900">Time slots</h3>
          <p className="mb-8 flex flex-wrap items-center gap-2 text-sm font-bold text-slate-400">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-green-600" />
              Available
            </span>
            <span>·</span>
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
              Booked
            </span>
          </p>

          {error ? (
            <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          ) : null}

          {loading ? (
            <p className="mb-6 font-medium text-slate-400">Loading slots…</p>
          ) : null}

          <div className="flex flex-col gap-4">
            {slots.map((slot) => {
              const taken = Boolean(slot.is_booked);
              const sub = slot.subject_name ? ` · ${slot.subject_name}` : "";
              const label = formatRange(slot.starts_at, slot.ends_at);
              return (
                <button
                  key={slot.id}
                  type="button"
                  className={`rounded-2xl border-2 px-6 py-4 text-left font-black transition-all ${
                    taken
                      ? "cursor-not-allowed border-red-100 bg-red-50/90 text-red-800"
                      : "border-green-100 bg-green-50/90 text-green-900 hover:border-green-200 hover:shadow-lg hover:shadow-green-100/50 disabled:opacity-60"
                  }`}
                  disabled={taken || bookingSlotId === slot.id}
                  onClick={() => bookSlot(slot)}
                >
                  {label}
                  {sub}
                  {taken ? " · Booked" : ""}
                </button>
              );
            })}
          </div>

          {!loading && slots.length === 0 ? (
            <p className="mt-8 text-center font-medium text-slate-400">
              No slots published yet.
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
            <div className="cc-glass max-w-md p-8 text-center shadow-2xl">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
                <i className="fas fa-check-circle text-2xl" aria-hidden />
              </div>
              <h2 className="mb-2 text-xl font-black text-slate-900">
                Booking confirmed
              </h2>
              <p className="font-medium text-slate-600">
                You booked{" "}
                <span className="font-black text-slate-900">
                  {teacher?.full_name}
                </span>{" "}
                at{" "}
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

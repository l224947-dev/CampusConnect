import campus from "../../assets/campus.jfif";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../contexts/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { session, profile, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!loading && session && profile) {
    if (profile.role === "teacher") {
      return <Navigate to="/teacher/dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogin = async () => {
    setError("");
    if (!email.trim() || !password) {
      setError("Fill all fields.");
      return;
    }

    setBusy(true);
    const { error: signErr } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);

    if (signErr) {
      const msg = signErr.message || "Sign in failed.";
      if (/invalid login credentials/i.test(msg)) {
        setError("No account found or wrong password. Try signing up first.");
      } else {
        setError(msg);
      }
      return;
    }

    const { data: u } = await supabase.auth.getUser();
    const uid = u.user?.id;
    if (!uid) return;

    const { data: row } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", uid)
      .maybeSingle();

    if (row?.role === "teacher") {
      navigate("/teacher/dashboard", { replace: true });
    } else {
      navigate("/dashboard", { replace: true });
    }
  };

  return (
    <div className="cc-auth-screen">
      <div
        className="cc-auth-bg"
        style={{ backgroundImage: `url(${campus})` }}
        aria-hidden
      />
      <div className="cc-auth-scrim" />
      <div className="cc-auth-blob" />
      <div className="cc-auth-blob2" />

      <div className="relative z-10 w-full max-w-md px-3 sm:px-4">
        <div className="rounded-[2.25rem] border border-white/25 bg-white/92 p-9 shadow-[0_25px_80px_-20px_rgba(49,46,129,0.45)] backdrop-blur-2xl sm:p-11">
          <div className="mb-9 text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-3xl text-white shadow-xl shadow-indigo-300/50">
              <i className="fas fa-graduation-cap" aria-hidden />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              CampusConnect
            </h1>
            <p className="mt-2 font-medium text-slate-500">
              Your campus hub for classes and office hours.
            </p>
          </div>

          {error ? (
            <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          ) : null}

          <div className="space-y-4">
            <div className="relative">
              <i
                className="fas fa-envelope pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <input
                type="email"
                autoComplete="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 py-4 pl-12 pr-5 font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
              />
            </div>
            <div className="relative">
              <i
                className="fas fa-lock pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <input
                type="password"
                autoComplete="current-password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 py-4 pl-12 pr-5 font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
              />
            </div>
            <button
              type="button"
              onClick={handleLogin}
              disabled={busy}
              className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 py-4 text-lg font-black text-white shadow-xl shadow-indigo-200/80 transition-all hover:from-indigo-700 hover:to-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <i className="fas fa-circle-notch fa-spin" aria-hidden />
                  Signing in…
                </span>
              ) : (
                "Log in"
              )}
            </button>
          </div>

          <p className="mt-8 text-center text-sm font-medium text-slate-500">
            Don’t have an account?{" "}
            <Link
              to="/signup"
              className="font-bold text-indigo-600 underline decoration-indigo-200 underline-offset-2 hover:text-violet-600"
            >
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

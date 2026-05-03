import campus from "../../assets/campus.jfif";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function Signup() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async () => {
    setError("");
    if (!name.trim() || !email.trim() || !password) {
      setError("Fill all fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setBusy(true);
    const { data, error: signErr } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: name.trim(),
          role,
        },
      },
    });
    setBusy(false);

    if (signErr) {
      setError(signErr.message || "Sign up failed.");
      return;
    }

    if (data.session) {
      navigate(role === "teacher" ? "/teacher/dashboard" : "/dashboard", {
        replace: true,
      });
      return;
    }

    navigate("/verify", { replace: true, state: { email: email.trim() } });
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
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-fuchsia-600 to-indigo-600 text-3xl text-white shadow-xl shadow-fuchsia-300/40">
              <i className="fas fa-user-plus" aria-hidden />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              Join CampusConnect
            </h1>
            <p className="mt-2 font-medium text-slate-500">
              Pick your role and start in seconds.
            </p>
          </div>

          {error ? (
            <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          ) : null}

          <div className="mb-6 flex rounded-2xl bg-slate-100 p-1.5">
            <button
              type="button"
              onClick={() => setRole("student")}
              className={`flex-1 rounded-xl py-3 text-sm font-bold transition-all ${
                role === "student"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              <i className="fas fa-book-reader mr-2" aria-hidden />
              Student
            </button>
            <button
              type="button"
              onClick={() => setRole("teacher")}
              className={`flex-1 rounded-xl py-3 text-sm font-bold transition-all ${
                role === "teacher"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              <i className="fas fa-chalkboard-teacher mr-2" aria-hidden />
              Teacher
            </button>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <i
                className="fas fa-signature pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <input
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 py-4 pl-12 pr-5 font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
              />
            </div>
            <div className="relative">
              <i
                className="fas fa-envelope pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <input
                placeholder="Email address"
                type="email"
                autoComplete="email"
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
                placeholder="Password (min 6 characters)"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 py-4 pl-12 pr-5 font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
              />
            </div>
            <button
              type="button"
              onClick={handleSignup}
              disabled={busy}
              className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 py-4 text-lg font-black text-white shadow-xl shadow-indigo-200/80 transition-all hover:from-indigo-700 hover:to-fuchsia-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <i className="fas fa-circle-notch fa-spin" aria-hidden />
                  Creating…
                </span>
              ) : (
                "Create account"
              )}
            </button>
          </div>

          <p className="mt-8 text-center text-sm font-medium text-slate-500">
            Already registered?{" "}
            <Link
              to="/"
              className="font-bold text-indigo-600 underline decoration-indigo-200 underline-offset-2 hover:text-violet-600"
            >
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

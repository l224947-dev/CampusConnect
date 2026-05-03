import { Link, useLocation } from "react-router-dom";
import campus from "../../assets/campus.jfif";

export default function Verify() {
  const location = useLocation();
  const email = location.state?.email;

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
        <div className="rounded-[2.25rem] border border-white/25 bg-white/92 p-10 text-center shadow-[0_25px_80px_-20px_rgba(49,46,129,0.45)] backdrop-blur-2xl sm:p-12">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-2xl text-white shadow-lg">
            <i className="fas fa-envelope-open-text" aria-hidden />
          </div>
          <h2 className="text-2xl font-black text-slate-900">
            Confirm your email
          </h2>
          <p className="mt-4 leading-relaxed text-slate-600">
            We sent a confirmation link
            {email ? (
              <>
                {" "}
                to <span className="font-bold text-slate-900">{email}</span>
              </>
            ) : null}
            . Open it to activate your account, then return here to log in.
          </p>
          <p className="mt-4 text-sm text-slate-500">
            For local development you can disable “Confirm email” under
            Supabase → Authentication → Providers → Email.
          </p>
          <Link
            to="/"
            className="mt-8 inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 py-4 font-black text-white shadow-xl shadow-indigo-200/80 transition-all hover:from-indigo-700 hover:to-violet-700"
          >
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}

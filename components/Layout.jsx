import { NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function navClass({ isActive }) {
  return [
    "flex w-full items-center gap-4 rounded-2xl px-6 py-4 text-left text-sm font-bold transition-all",
    isActive
      ? "cc-sidebar-active"
      : "border-r-4 border-transparent text-slate-500 hover:bg-slate-50",
  ].join(" ");
}

export default function Layout({ children }) {
  const { profile, signOut } = useAuth();
  const isTeacher = profile?.role === "teacher";

  const studentLinks = (
    <>
      <NavLink to="/dashboard" className={navClass} end>
        <i className="fas fa-shapes w-5 text-center" aria-hidden />
        My classes
      </NavLink>
      <NavLink to="/profile" className={navClass}>
        <i className="fas fa-id-badge w-5 text-center" aria-hidden />
        My profile
      </NavLink>
    </>
  );

  const teacherLinks = (
    <>
      <NavLink to="/teacher/dashboard" className={navClass} end>
        <i className="fas fa-chalkboard-user w-5 text-center" aria-hidden />
        Class studio
      </NavLink>
      <NavLink to="/profile" className={navClass}>
        <i className="fas fa-calendar-check w-5 text-center" aria-hidden />
        Live schedule
      </NavLink>
    </>
  );

  const handleSignOut = () => {
    signOut().then(() => {
      window.location.href = "/";
    });
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <aside className="hidden w-72 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="flex items-center gap-4 p-10">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-lg text-white shadow-lg shadow-indigo-200">
            <i className="fas fa-graduation-cap" aria-hidden />
          </div>
          <span className="text-2xl font-black tracking-tight text-slate-900">
            CampusConnect
          </span>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-4">
          {isTeacher ? teacherLinks : studentLinks}
        </nav>

        <div className="border-t border-slate-100 p-8">
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-red-50 py-4 font-bold text-red-600 transition-all hover:bg-red-100"
          >
            <i className="fas fa-power-off text-sm" aria-hidden />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur-md md:hidden">
          <div className="mb-3 flex items-center justify-between">
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-lg font-black text-transparent">
              CampusConnect
            </span>
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600"
            >
              Out
            </button>
          </div>
          <nav className="flex flex-wrap gap-2">
            {isTeacher ? (
              <>
                <NavLink
                  to="/teacher/dashboard"
                  className={({ isActive }) =>
                    `rounded-xl px-4 py-2 text-xs font-bold ${
                      isActive
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`
                  }
                >
                  Studio
                </NavLink>
                <NavLink
                  to="/profile"
                  className={({ isActive }) =>
                    `rounded-xl px-4 py-2 text-xs font-bold ${
                      isActive
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`
                  }
                >
                  Schedule
                </NavLink>
              </>
            ) : (
              <>
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) =>
                    `rounded-xl px-4 py-2 text-xs font-bold ${
                      isActive
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`
                  }
                >
                  Classes
                </NavLink>
                <NavLink
                  to="/profile"
                  className={({ isActive }) =>
                    `rounded-xl px-4 py-2 text-xs font-bold ${
                      isActive
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`
                  }
                >
                  Profile
                </NavLink>
              </>
            )}
          </nav>
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-12">{children}</main>
      </div>
    </div>
  );
}

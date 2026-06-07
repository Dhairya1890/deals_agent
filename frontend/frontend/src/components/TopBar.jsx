import { NavLink } from "react-router-dom";
import logo from "../assets/logo.png";

const NAV_ITEMS = [
  { icon: "dashboard", label: "Dashboard", to: "/" },
  { icon: "query_stats", label: "Leads", to: "/pipeline" },
];

export default function TopBar() {


  return (
    <header className="grid grid-cols-[1fr_auto_1fr] items-center h-16 px-8 sticky top-0 z-40 bg-[#030712]/40 backdrop-blur-xl border-b border-white/[0.06] shadow-lg shadow-black/10">
      {/* Left: Logo & Brand */}
      <div className="flex items-center gap-3 justify-self-start">
        <img
          alt="DealClaw Logo"
          className="w-12 h-12 object-contain"
          src={logo}
        />
        <div>
          <h1 className="font-sans text-xl font-black text-primary-400">
            DealClaw
          </h1>
        </div>
      </div>

      {/* Center: Navigation Links */}
      <nav className="hidden md:flex items-center justify-self-center gap-2">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.to === "/"}
            onClick={(e) => {
              if (item.to === "#") {
                e.preventDefault();
                alert(`${item.label} module is under development.`);
              }
            }}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive && item.to !== "#"
                  ? "text-primary-300 bg-primary-500/15 backdrop-blur-sm font-semibold border border-primary-500/20"
                  : "text-text-secondary hover:text-text-primary hover:bg-white/[0.06] border border-transparent"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Right: Search, New Deal, Actions */}
      <div className="flex items-center gap-6 justify-self-end">
        {/* Search */}
        <div className="relative hidden lg:block">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-lg">
            search
          </span>
          <input
            className="bg-white/[0.04] border border-white/[0.08] rounded-full py-1.5 pl-10 pr-4 text-sm text-text-primary focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/30 focus:bg-white/[0.06] transition-all w-56 placeholder:text-text-muted backdrop-blur-sm"
            placeholder="Search deals..."
            type="text"
            id="topbar-search"
          />
        </div>
        
        {/* Import from CRM Button */}
        <button
          onClick={() => document.dispatchEvent(new CustomEvent("open-new-deal"))}
          className="bg-primary-600/80 hover:bg-primary-600 backdrop-blur-sm text-white px-4 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all shadow-lg shadow-primary-600/20 border border-primary-500/30"
        >
          <span className="material-symbols-outlined text-[18px] font-bold">upload</span>
          Import from CRM
        </button>

      </div>
    </header>
  );
}

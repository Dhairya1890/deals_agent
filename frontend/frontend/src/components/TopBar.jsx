import { NavLink, useLocation } from "react-router-dom";
import logo from "../assets/logo.png";

const NAV_ITEMS = [
  { icon: "dashboard", label: "Dashboard", to: "/" },
  { icon: "query_stats", label: "Pipeline", to: "/pipeline" },
  { icon: "forum", label: "Conversations", to: "#" },
  { icon: "psychology", label: "Intelligence", to: "#" },
];

export default function TopBar() {
  const location = useLocation();

  return (
    <header className="grid grid-cols-[1fr_auto_1fr] items-center h-16 px-8 sticky top-0 z-40 bg-bg/80 backdrop-blur-md border-b border-white/5">
      {/* Left: Logo & Brand */}
      <div className="flex items-center gap-3 justify-self-start">
        <img
          alt="DealClaw Logo"
          className="w-10 h-10 rounded mix-blend-screen"
          src={logo}
        />
        <div>
          <h1 className="font-sans text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-accent-500">
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
                  ? "text-primary-400 bg-primary-600/10"
                  : "text-white/60 hover:text-white/90 hover:bg-white/5"
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
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-lg">
            search
          </span>
          <input
            className="bg-white/5 border border-white/10 rounded-full py-1.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600 transition-colors w-56 placeholder:text-white/40"
            placeholder="Search deals..."
            type="text"
            id="topbar-search"
          />
        </div>
        
        {/* New Deal Button */}
        <button
          onClick={() => document.dispatchEvent(new CustomEvent("open-new-deal"))}
          className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-primary-600/20"
        >
          <span className="material-symbols-outlined text-[18px] font-bold">add</span>
          New Deal
        </button>

      </div>
    </header>
  );
}

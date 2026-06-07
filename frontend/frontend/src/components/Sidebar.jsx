import { NavLink, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

const NAV_ITEMS = [
  { icon: "dashboard", label: "Dashboard", to: "/" },
  { icon: "query_stats", label: "Pipeline", to: "/pipeline" },
  { icon: "forum", label: "Conversations", to: "#" },
  { icon: "psychology", label: "Intelligence", to: "#" },
];

export default function Sidebar() {
  const navigate = useNavigate();

  return (
    <nav className="h-full w-64 fixed left-0 top-0 bg-white/[0.05] backdrop-blur-xl border-r border-white/10 shadow-xl flex flex-col py-6 px-4 z-50">
      {/* Logo & Brand */}
      <div className="mb-8 px-2 flex items-center gap-3">
        <img
          alt="DealClaw Logo"
          className="w-8 h-8 rounded"
          src={logo}
        />
        <div>
          <h1 className="font-sans text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-accent-500">
            DealClaw
          </h1>
          <p className="text-[10px] text-white/50 uppercase tracking-widest font-display mt-0.5">
            Deal Intelligence Agent
          </p>
        </div>
      </div>

      {/* New Deal Button */}
      <button
        onClick={() => document.dispatchEvent(new CustomEvent("open-new-deal"))}
        className="w-full bg-primary-600 hover:bg-secondary-500 text-white font-medium text-sm py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 mb-8 transition-colors shadow-lg shadow-primary-600/20"
        id="sidebar-new-deal"
      >
        <span
          className="material-symbols-outlined text-lg"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          add
        </span>
        New Deal
      </button>

      {/* Navigation Links */}
      <ul className="space-y-1.5 flex-1">
        {NAV_ITEMS.map((item) => (
          <li key={item.label}>
            <NavLink
              to={item.to}
              end={item.to === "/"}
              onClick={(e) => {
                if (item.to === "#") {
                  e.preventDefault();
                  alert(`${item.label} module is under development.`);
                }
              }}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive && item.to !== "#"
                    ? "text-primary-400 bg-primary-600/10 border-r-2 border-primary-600"
                    : "text-white/60 hover:text-white/90 hover:bg-white/5"
                }`
              }
            >
              <span
                className="material-symbols-outlined text-xl"
                style={
                  item.filled
                    ? { fontVariationSettings: "'FILL' 1" }
                    : undefined
                }
              >
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>

      {/* Settings */}
      <div className="mt-auto">
        <a
          href="#"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/60 hover:text-white/90 hover:bg-white/5 transition-colors text-sm font-medium"
        >
          <span className="material-symbols-outlined text-xl">settings</span>
          Settings
        </a>
      </div>
    </nav>
  );
}

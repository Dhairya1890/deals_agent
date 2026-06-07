import { useLocation } from "react-router-dom";

const PAGE_TITLES = {
  "/": "Pipeline",
};

export default function TopBar() {
  const location = useLocation();
  const isDealPage = location.pathname.startsWith("/deals/");
  const title = isDealPage
    ? "Deal Detail"
    : PAGE_TITLES[location.pathname] || "Pipeline";

  return (
    <header className="flex justify-between items-center h-14 px-8 sticky top-0 z-40 bg-bg/80 backdrop-blur-md border-b border-white/5">
      <div className="flex items-center gap-4">
        <h2 className="font-display tracking-tight text-lg font-bold text-white">
          {title}
        </h2>
      </div>
      <div className="flex items-center gap-6">
        {/* Search */}
        <div className="relative hidden md:block">
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
        {/* Action icons */}
        <div className="flex items-center gap-3">
          <button className="text-white/60 hover:text-cyan-400 transition-all active:opacity-80">
            <span className="material-symbols-outlined text-xl">
              notifications
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}

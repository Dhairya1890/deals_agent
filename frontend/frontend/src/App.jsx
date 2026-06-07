import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import TopBar from "./components/TopBar";
import DealsPage from "./pages/DealsPage";
import DealPage from "./pages/DealPage";

export default function App() {
  const location = useLocation();

  return (
    <div className="min-h-screen relative flex flex-col bg-[#030712] text-slate-200">
      {/* Dotted background pattern */}
      <div 
        className="absolute inset-0 z-0 opacity-20 pointer-events-none" 
        style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }}
      ></div>

      <div className="relative z-10 flex-1 flex flex-col min-h-screen">
        {/* TopBar replaces the Sidebar */}
        <TopBar />

        {/* Main area */}
        <main className="flex-1 flex flex-col">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<DealsPage mode="dashboard" />} />
              <Route path="/pipeline" element={<DealsPage mode="pipeline" />} />
              <Route path="/deals/:id" element={<DealPage />} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

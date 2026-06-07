import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import DealsPage from "./pages/DealsPage";
import DealPage from "./pages/DealPage";

export default function App() {
  const location = useLocation();
  const isDealPage = location.pathname.startsWith("/deals/");

  return (
    <div className="noise-bg min-h-screen relative flex">
      {/* Sidebar — always visible */}
      <Sidebar />

      {/* Main area — offset by sidebar width */}
      <div className="ml-64 flex-1 flex flex-col min-h-screen">
        {/* TopBar only on non-deal pages (deal page has its own full-width layout) */}
        {!isDealPage && <TopBar />}

        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<DealsPage mode="dashboard" />} />
            <Route path="/pipeline" element={<DealsPage mode="pipeline" />} />
            <Route path="/deals/:id" element={<DealPage />} />
          </Routes>
        </AnimatePresence>
      </div>
    </div>
  );
}

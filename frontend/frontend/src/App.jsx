import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import TopBar from "./components/TopBar";
import DealsPage from "./pages/DealsPage";
import DealPage from "./pages/DealPage";

export default function App() {
  const location = useLocation();

  return (
    <div className="noise-bg min-h-screen relative flex flex-col">
      {/* TopBar replaces the Sidebar */}
      <TopBar />

      {/* Main area */}
      <main className="flex-1 flex flex-col min-h-screen">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<DealsPage mode="dashboard" />} />
            <Route path="/pipeline" element={<DealsPage mode="pipeline" />} />
            <Route path="/deals/:id" element={<DealPage />} />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  );
}

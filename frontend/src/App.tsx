import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import { RoughFilter } from "./components/Stamp";
import HireFlow from "./pages/HireFlow";
import Landing from "./pages/Landing";
import ManagerOrderIn from "./pages/ManagerOrderIn";
import ManagerRail from "./pages/ManagerRail";

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <RoughFilter />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/manager" element={<ManagerRail />} />
          <Route path="/manager/new" element={<ManagerOrderIn />} />
          <Route path="/t/:token" element={<HireFlow />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </MotionConfig>
  );
}

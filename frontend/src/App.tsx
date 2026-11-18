import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import { AuthProvider, RequireRole } from "./lib/auth";
import CoursePlayer from "./pages/CoursePlayer";
import { JobBoard, JobDetail, MyApplications } from "./pages/Jobs";
import Landing from "./pages/Landing";
import Learn from "./pages/Learn";
import Login from "./pages/Login";
import ManagerOrderIn from "./pages/ManagerOrderIn";
import ManagerRail from "./pages/ManagerRail";

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/jobs" element={<JobBoard />} />
            <Route path="/jobs/:id" element={<JobDetail />} />
            <Route path="/me" element={<RequireRole role="applicant"><MyApplications /></RequireRole>} />
            <Route path="/learn" element={<Learn />} />
            <Route path="/learn/:role" element={<CoursePlayer />} />
            <Route path="/t/:token" element={<CoursePlayer />} />
            <Route path="/manager" element={<RequireRole role="manager"><ManagerRail /></RequireRole>} />
            <Route path="/manager/new" element={<RequireRole role="manager"><ManagerOrderIn /></RequireRole>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </MotionConfig>
  );
}

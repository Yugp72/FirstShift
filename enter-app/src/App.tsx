// FirstShift on Enter (Converge.AI). The app lives in src/fs; its API is the firstshift-api edge function.
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import { AuthProvider, RequireRole } from "./fs/lib/auth";
import CoursePlayer from "./fs/pages/CoursePlayer";
import { JobBoard, JobDetail, MyApplications } from "./fs/pages/Jobs";
import Landing from "./fs/pages/Landing";
import Learn from "./fs/pages/Learn";
import Login from "./fs/pages/Login";
import ManagerOrderIn from "./fs/pages/ManagerOrderIn";
import ManagerRail from "./fs/pages/ManagerRail";

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

import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login/Login";
import Signup from "./pages/Signup/Signup";
import Verify from "./pages/Verify/Verify";
import Dashboard from "./pages/Dashboard/Dashboard";
import TeacherDashboard from "./pages/TeacherDashboard/TeacherDashboard";
import Professor from "./pages/Professor/Professor";
import SubjectSlots from "./pages/SubjectSlots/SubjectSlots";
import Profile from "./pages/Profile/Profile";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify" element={<Verify />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute role="student">
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/dashboard"
          element={
            <ProtectedRoute role="teacher">
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/book/:teacherId/:subjectId"
          element={
            <ProtectedRoute role="student">
              <SubjectSlots />
            </ProtectedRoute>
          }
        />
        <Route
          path="/professor/:id"
          element={
            <ProtectedRoute role="student">
              <Professor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

// App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthGuard } from "./components/AuthGuard";
import LoginPage from "./pages/Login";
import POSDashboard from "./pages/Pos";
import KDSScreen from "./pages/Kds";

export default function App() {
  return (
    <>
      <Toaster position="top-center"/>
      <Routes>
        {/* 1. PUBLIC ROUTE: Anyone can see the login page */}
        <Route path="/login" element={<LoginPage />} />

        {/* 2. PROTECTED POS ROUTE: Only users with role "POS" */}
        <Route element={<AuthGuard allowedRole="POS" />}>
          <Route path="/pos" element={<POSDashboard />} />
        </Route>

        {/* 3. PROTECTED KDS ROUTE: Only users with role "KDS" */}
        <Route element={<AuthGuard allowedRole="KDS" />}>
          <Route path="/kds" element={<KDSScreen />} />
        </Route>

        {/* DEFAULT: Redirect unknown paths to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}

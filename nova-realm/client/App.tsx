import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { useEffect, ReactNode } from "react";
import Login from "./pages/Login";
import Employees from "./pages/Employees";
import AddEmployee from "./pages/AddEmployee";
import EditEmployee from "./pages/EditEmployee";
import EmployeeCard from "./pages/EmployeeCard";
import ImportEmployees from "./pages/ImportEmployees";
import Renewals from "./pages/Renewals";
import Stats from "./pages/Stats";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

interface ProtectedRouteProps {
  children: ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />

          {/* Protected Routes */}
          <Route
            path="/employees"
            element={
              <ProtectedRoute>
                <Employees />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employees/add"
            element={
              <ProtectedRoute>
                <AddEmployee />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employees/import"
            element={
              <ProtectedRoute>
                <ImportEmployees />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employees/:id"
            element={
              <ProtectedRoute>
                <EmployeeCard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employees/:id/edit"
            element={
              <ProtectedRoute>
                <EditEmployee />
              </ProtectedRoute>
            }
          />
          <Route
            path="/renewals"
            element={
              <ProtectedRoute>
                <Renewals />
              </ProtectedRoute>
            }
          />
          <Route
            path="/stats"
            element={
              <ProtectedRoute>
                <Stats />
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);

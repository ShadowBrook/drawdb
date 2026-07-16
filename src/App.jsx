import { HashRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useLayoutEffect, lazy, Suspense } from "react";
import SettingsContextProvider from "./context/SettingsContext";
import NotFound from "./pages/NotFound";

const Editor = lazy(() => import("./pages/Editor"));
const BugReport = lazy(() => import("./pages/BugReport"));
const Templates = lazy(() => import("./pages/Templates"));

function Loading() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-lg text-slate-400">Loading...</div>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <SettingsContextProvider>
        <RestoreScroll />
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Navigate to="/editor" replace />} />
            <Route path="/editor" element={<Editor />} />
            <Route path="/editor/diagrams/:id" element={<Editor />} />
            <Route path="/editor/templates/:id" element={<Editor />} />
            <Route path="/bug-report" element={<BugReport />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </SettingsContextProvider>
    </HashRouter>
  );
}

function RestoreScroll() {
  const location = useLocation();
  useLayoutEffect(() => {
    window.scroll(0, 0);
  }, [location.pathname]);
  return null;
}

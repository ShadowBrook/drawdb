import { HashRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useLayoutEffect } from "react";
import Editor from "./pages/Editor";
import BugReport from "./pages/BugReport";
import Templates from "./pages/Templates";
import SettingsContextProvider from "./context/SettingsContext";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <HashRouter>
      <SettingsContextProvider>
        <RestoreScroll />
        <Routes>
          <Route path="/" element={<Navigate to="/editor" replace />} />
          <Route path="/editor" element={<Editor />} />
          <Route path="/editor/diagrams/:id" element={<Editor />} />
          <Route path="/editor/templates/:id" element={<Editor />} />
          <Route path="/bug-report" element={<BugReport />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
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

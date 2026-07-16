import { useEffect, useRef } from "react";

/**
 * Listens for Electron menu bar actions and syncs language to the main process.
 * No-op in non-Electron environments.
 */
export default function useElectronMenu(handlers, language) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  // Sync language to native menu (only on explicit change, not initial mount).
  // The main process already detects system language via app.getLocale().
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (language && window.electronAPI?.setLanguage) {
      window.electronAPI.setLanguage(language);
    }
  }, [language]);

  // Listen for menu actions
  useEffect(() => {
    const api = window.electronAPI;
    if (!api?.onMenuAction) return;

    api.onMenuAction((action) => {
      if (handlersRef.current[action]) {
        handlersRef.current[action]();
      }
    });

    return () => {
      if (api?.removeMenuActionListener) {
        api.removeMenuActionListener();
      }
    };
  }, []);
}

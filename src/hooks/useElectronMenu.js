import { useEffect, useRef } from "react";

/**
 * Listens for Electron menu bar actions and dispatches them to
 * the provided handler functions. No-op in non-Electron environments.
 */
export default function useElectronMenu(handlers) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

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

import { useEffect } from "react";

/**
 * Listens for Electron menu bar actions and dispatches them to
 * the provided handler functions. No-op in non-Electron environments.
 *
 * @param {Object} handlers - Action-to-function map, e.g.
 *   { 'new': () => ..., 'save': () => ..., 'zoom-in': () => ... }
 */
export default function useElectronMenu(handlers) {
  useEffect(() => {
    const api = window.electronAPI;
    if (!api?.onMenuAction) return;

    api.onMenuAction((action) => {
      if (handlers[action]) {
        handlers[action]();
      }
    });

    return () => {
      if (api?.removeMenuActionListener) {
        api.removeMenuActionListener();
      }
    };
  }, [handlers]);
}

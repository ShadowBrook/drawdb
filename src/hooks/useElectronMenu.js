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
    console.log('[renderer] useElectronMenu: electronAPI available:', !!api, 'onMenuAction:', !!api?.onMenuAction);

    if (!api?.onMenuAction) {
      console.warn('[renderer] electronAPI not available — menu bar will not work');
      return;
    }

    api.onMenuAction((action) => {
      console.log('[renderer] menu-action received:', action, 'hasHandler:', action in handlers);
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

// Simple cross-component data refresh mechanism
// Components call notifyDataChanged() after mutations,
// and other components listening via useDataRefresh() will re-fetch.

import { useEffect } from "react";

const EVENT_NAME = "rentflow:data-changed";

export function notifyDataChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  }
}

export function useDataRefresh(callback: () => void) {
  useEffect(() => {
    const handler = () => callback();
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }, [callback]);
}

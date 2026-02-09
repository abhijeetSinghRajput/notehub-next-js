"use client";

import { create } from "zustand";
import { toast } from "sonner";
import { CheckCircle, AlertTriangle, RefreshCw } from "lucide-react";

type NetworkStore = {
  isOnline: boolean;
  initNetworkWatcher: () => () => void;
};

export const useNetworkStore = create<NetworkStore>((set) => ({
  isOnline: true,

  initNetworkWatcher: () => {
    if (typeof window === "undefined") return () => {};

    const setOnline = (status: boolean) => {
      set({ isOnline: status });

      if (status) {
        toast.success("Connected", {
          description: "You're back online",
          duration: 4000,
          icon: <CheckCircle className="text-green-500" />,
          action: {
            label: (
              <div className="flex items-center gap-1">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </div>
            ),
            onClick: () => window.location.reload(),
          },
        });
      } else {
        toast("Connection Lost", {
          description: "You're currently offline. Changes may not be saved.",
          duration: 8000,
          icon: <AlertTriangle className="text-yellow-500" />,
          action: {
            label: (
              <div className="flex items-center gap-1">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </div>
            ),
            onClick: () => window.location.reload(),
          },
        });
      }
    };

    // initial state
    setOnline(navigator.onLine);

    const onlineHandler = () => setOnline(true);
    const offlineHandler = () => setOnline(false);

    window.addEventListener("online", onlineHandler);
    window.addEventListener("offline", offlineHandler);

    // cleanup
    return () => {
      window.removeEventListener("online", onlineHandler);
      window.removeEventListener("offline", offlineHandler);
    };
  },
}));

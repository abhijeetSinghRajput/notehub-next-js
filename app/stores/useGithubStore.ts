import { create } from "zustand";
import axios from "axios";
import { formatCompactNumber } from "@/lib/utils";

interface GithubState {
  starCount: string | null;
  fetchStars: () => Promise<void>;
}

export const useGithubStore = create<GithubState>((set) => ({
  starCount: null,
  fetchStars: async () => {
    try {
      const response = await axios.get(
        "https://api.github.com/repos/abhijeetSinghRajput/notehub"
      );
      const count = response.data?.stargazers_count ?? 0;
      set({ starCount: formatCompactNumber(count) });
    } catch (err) {
      console.error("Failed to fetch GitHub stars", err);
      set({ starCount: null });
    }
  },
}));

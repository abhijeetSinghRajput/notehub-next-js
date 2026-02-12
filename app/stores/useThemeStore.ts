import { create } from "zustand";

interface ColorConfig {
  defaultColor: string;
  property: string;
  noLabel?: boolean;
}

interface ThemeGroup {
  bg: ColorConfig;
  fg?: ColorConfig;
}

interface ThemeVariables {
  card: ThemeGroup;
  popover: ThemeGroup;
  primary: ThemeGroup;
  secondary: ThemeGroup;
  muted: ThemeGroup;
  accent: ThemeGroup;
  destructive: ThemeGroup;
  background: { bg: ColorConfig };
  foreground: { bg: ColorConfig };
  border: { bg: ColorConfig };
  input: { bg: ColorConfig };
  ring: { bg: ColorConfig };
}

interface ThemeStore {
  variable: ThemeVariables;
  updateVariable: () => void;
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  variable: {
    card: {
      bg: { defaultColor: "240 10% 3.9%", property: "--card" },
      fg: { defaultColor: "0 0% 98%", property: "--card-foreground" },
    },
    popover: {
      bg: { defaultColor: "240 10% 3.9%", property: "--popover" },
      fg: { defaultColor: "0 0% 98%", property: "--popover-foreground" },
    },
    primary: {
      bg: { defaultColor: "0 0% 98%", property: "--primary" },
      fg: { defaultColor: "240 5.9% 10%", property: "--primary-foreground" },
    },
    secondary: {
      bg: { defaultColor: "240 3.7% 15.9%", property: "--secondary" },
      fg: { defaultColor: "0 0% 98%", property: "--secondary-foreground" },
    },
    muted: {
      bg: { defaultColor: "240 3.7% 15.9%", property: "--muted" },
      fg: { defaultColor: "240 5% 64.9%", property: "--muted-foreground" },
    },
    accent: {
      bg: { defaultColor: "240 3.7% 15.9%", property: "--accent" },
      fg: { defaultColor: "0 0% 98%", property: "--accent-foreground" },
    },
    destructive: {
      bg: { defaultColor: "0 62.8% 30.6%", property: "--destructive" },
      fg: { defaultColor: "0 0% 98%", property: "--destructive-foreground" },
    },
    background: {
      bg: {
        noLabel: true,
        defaultColor: "240 10% 3.9%",
        property: "--background",
      },
    },
    foreground: {
      bg: {
        noLabel: true,
        defaultColor: "240 10% 3.9%",
        property: "--background",
      },
    },
    border: {
      bg: {
        noLabel: true,
        defaultColor: "240 3.7% 15.9%",
        property: "--border",
      },
    },
    input: {
      bg: {
        noLabel: true,
        defaultColor: "240 3.7% 15.9%",
        property: "--input",
      },
    },
    ring: {
      bg: { noLabel: true, defaultColor: "240 4.9% 83.9%", property: "--ring" },
    },
  },

  updateVariable: () => {
    const root = document.documentElement;
    const state = get().variable;
    const updated: Partial<ThemeVariables> = {};

    for (const key in state) {
      const themeGroup = state[key as keyof ThemeVariables];
      updated[key as keyof ThemeVariables] = {} as any;

      for (const type in themeGroup) {
        const { property } = themeGroup[
          type as keyof typeof themeGroup
        ] as ColorConfig;
        const computedValue = getComputedStyle(root)
          .getPropertyValue(property)
          .trim();

        (updated[key as keyof ThemeVariables] as any)[type] = {
          ...themeGroup[type as keyof typeof themeGroup],
          defaultColor: computedValue,
        };
      }
    }
    set({ variable: updated as ThemeVariables });
  },
}));

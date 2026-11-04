import type { CSSProperties } from "react";
import type { TemplateId } from "@/types/site";

/** Variables CSS para asistente + pestañas + acentos CRM/dashboard (por plantilla visual). */
export type OperationsThemeVars = {
  "--ops-shell-bg": string;
  "--ops-shell-border": string;
  "--ops-shell-shadow": string;
  "--ops-kicker": string;
  "--ops-tab-bar-bg": string;
  "--ops-tab-text": string;
  "--ops-tab-hover-bg": string;
  "--ops-tab-hover-text": string;
  "--ops-tab-active-bg": string;
  "--ops-tab-active-text": string;
  "--ops-accent": string;
  "--ops-accent-ink": string;
  "--ops-accent-soft": string;
  "--ops-chat-bg": string;
  "--ops-chat-bg-mid": string;
  "--ops-chat-bg-end": string;
  "--ops-chat-border": string;
  "--ops-chat-text": string;
  "--ops-chat-muted": string;
  "--ops-bubble-bot-bg": string;
  "--ops-bubble-bot-text": string;
  "--ops-bubble-user-bg": string;
  "--ops-bubble-user-text": string;
  "--ops-chip-bg": string;
  "--ops-chip-border": string;
  "--ops-composer-bg": string;
  "--ops-composer-border": string;
  "--ops-composer-text": string;
  "--ops-mic-bg": string;
  "--ops-mic-icon": string;
  "--ops-mic-hover-bg": string;
  "--ops-mic-hover-icon": string;
  "--ops-mic-on-bg": string;
  "--ops-mic-on-icon": string;
  "--ops-quota-track-border": string;
  "--ops-quota-value": string;
  "--ops-focus-ring": string;
  "--ops-crm-active-border": string;
  "--ops-crm-nav-bg": string;
  "--ops-dash-empty-bg": string;
  "--ops-dash-empty-border": string;
  "--ops-head-ink": string;
  "--ops-head-muted": string;
  "--ops-crm-ink": string;
  "--ops-crm-muted": string;
  "--ops-chart-1": string;
  "--ops-chart-2": string;
  "--ops-chart-3": string;
  "--ops-chart-4": string;
  "--ops-chart-5": string;
  "--ops-chart-axis": string;
  "--ops-chart-grid": string;
  "--ops-chart-trend-actual": string;
  "--ops-chart-trend-projected": string;
  "--ops-chart-trend-fill": string;
};

function opsChartVars(series: [string, string, string, string, string], ink: string, accent: string, accentSoft: string) {
  return {
    "--ops-chart-1": series[0],
    "--ops-chart-2": series[1],
    "--ops-chart-3": series[2],
    "--ops-chart-4": series[3],
    "--ops-chart-5": series[4],
    "--ops-chart-axis": `color-mix(in srgb, ${ink} 24%, transparent)`,
    "--ops-chart-grid": `color-mix(in srgb, ${ink} 9%, transparent)`,
    "--ops-chart-trend-actual": ink,
    "--ops-chart-trend-projected": accent,
    "--ops-chart-trend-fill": accentSoft,
  } satisfies Pick<
    OperationsThemeVars,
    | "--ops-chart-1"
    | "--ops-chart-2"
    | "--ops-chart-3"
    | "--ops-chart-4"
    | "--ops-chart-5"
    | "--ops-chart-axis"
    | "--ops-chart-grid"
    | "--ops-chart-trend-actual"
    | "--ops-chart-trend-projected"
    | "--ops-chart-trend-fill"
  >;
}

const THEMES: Record<TemplateId, OperationsThemeVars> = {
  turismo: {
    "--ops-shell-bg": "linear-gradient(180deg, #fffdf8 0%, rgba(246, 244, 232, 0.6) 100%)",
    "--ops-shell-border": "1px solid rgba(83, 70, 240, 0.16)",
    "--ops-shell-shadow": "0 28px 70px rgba(83, 70, 240, 0.1)",
    "--ops-kicker": "#5d7a72",
    "--ops-tab-bar-bg": "rgba(83, 70, 240, 0.06)",
    "--ops-tab-text": "#24564c",
    "--ops-tab-hover-bg": "rgba(83, 70, 240, 0.16)",
    "--ops-tab-hover-text": "#5346f0",
    "--ops-tab-active-bg": "#5346f0",
    "--ops-tab-active-text": "#ffffff",
    "--ops-accent": "#5346f0",
    "--ops-accent-ink": "#ffffff",
    "--ops-accent-soft": "rgba(83, 70, 240, 0.12)",
    "--ops-chat-bg": "#4338ca",
    "--ops-chat-bg-mid": "#5346f0",
    "--ops-chat-bg-end": "#6366f1",
    "--ops-chat-border": "rgba(255, 255, 255, 0.12)",
    "--ops-chat-text": "#f6f4e8",
    "--ops-chat-muted": "rgba(246, 244, 232, 0.78)",
    "--ops-bubble-bot-bg": "rgba(246, 244, 232, 0.97)",
    "--ops-bubble-bot-text": "#12362f",
    "--ops-bubble-user-bg": "#5346f0",
    "--ops-bubble-user-text": "#ffffff",
    "--ops-chip-bg": "rgba(255, 255, 255, 0.12)",
    "--ops-chip-border": "rgba(255, 255, 255, 0.28)",
    "--ops-composer-bg": "#ffffff",
    "--ops-composer-border": "rgba(83, 70, 240, 0.2)",
    "--ops-composer-text": "#12362f",
    "--ops-mic-bg": "rgba(83, 70, 240, 0.1)",
    "--ops-mic-icon": "#5346f0",
    "--ops-mic-hover-bg": "rgba(83, 70, 240, 0.2)",
    "--ops-mic-hover-icon": "#4338ca",
    "--ops-mic-on-bg": "#5346f0",
    "--ops-mic-on-icon": "#ffffff",
    "--ops-quota-track-border": "rgba(83, 70, 240, 0.35)",
    "--ops-quota-value": "#12181a",
    "--ops-focus-ring": "rgba(83, 70, 240, 0.45)",
    "--ops-crm-active-border": "rgba(83, 70, 240, 0.35)",
    "--ops-crm-nav-bg": "rgba(83, 70, 240, 0.04)",
    "--ops-dash-empty-bg": "rgba(83, 70, 240, 0.06)",
    "--ops-dash-empty-border": "rgba(83, 70, 240, 0.2)",
    "--ops-head-ink": "#12362f",
    "--ops-head-muted": "#24564c",
    "--ops-crm-ink": "#12362f",
    "--ops-crm-muted": "#5d7a72",
    ...opsChartVars(["#5346f0", "#12362f", "#6366f1", "#3d7a6a", "#4338ca"], "#12362f", "#5346f0", "rgba(83, 70, 240, 0.14)"),
  },
  metalurgia: {
    "--ops-shell-bg": "linear-gradient(180deg, #f4f3ef 0%, #e8e7e2 100%)",
    "--ops-shell-border": "1px solid rgba(12, 12, 13, 0.14)",
    "--ops-shell-shadow": "0 28px 70px rgba(0, 0, 0, 0.12)",
    "--ops-kicker": "#494b52",
    "--ops-tab-bar-bg": "#2c2e33",
    "--ops-tab-text": "#d0d2d8",
    "--ops-tab-hover-bg": "rgba(255, 210, 31, 0.14)",
    "--ops-tab-hover-text": "#ffffff",
    "--ops-tab-active-bg": "#ffd21f",
    "--ops-tab-active-text": "#0c0c0d",
    "--ops-accent": "#ffd21f",
    "--ops-accent-ink": "#0c0c0d",
    "--ops-accent-soft": "rgba(255, 210, 31, 0.22)",
    "--ops-chat-bg": "#0c0c0d",
    "--ops-chat-bg-mid": "#17181b",
    "--ops-chat-bg-end": "#2c2e33",
    "--ops-chat-border": "rgba(255, 255, 255, 0.12)",
    "--ops-chat-text": "#f4f3ef",
    "--ops-chat-muted": "rgba(244, 243, 239, 0.72)",
    "--ops-bubble-bot-bg": "#f4f3ef",
    "--ops-bubble-bot-text": "#0c0c0d",
    "--ops-bubble-user-bg": "#ffd21f",
    "--ops-bubble-user-text": "#0c0c0d",
    "--ops-chip-bg": "rgba(255, 255, 255, 0.08)",
    "--ops-chip-border": "rgba(255, 210, 31, 0.35)",
    "--ops-composer-bg": "#2c2e33",
    "--ops-composer-border": "rgba(255, 255, 255, 0.14)",
    "--ops-composer-text": "#ffffff",
    "--ops-mic-bg": "rgba(255, 255, 255, 0.08)",
    "--ops-mic-icon": "#ffd21f",
    "--ops-mic-hover-bg": "rgba(255, 210, 31, 0.2)",
    "--ops-mic-hover-icon": "#ffd21f",
    "--ops-mic-on-bg": "#ffd21f",
    "--ops-mic-on-icon": "#0c0c0d",
    "--ops-quota-track-border": "rgba(255, 210, 31, 0.45)",
    "--ops-quota-value": "#0c0c0d",
    "--ops-focus-ring": "rgba(255, 210, 31, 0.55)",
    "--ops-crm-active-border": "rgba(255, 210, 31, 0.5)",
    "--ops-crm-nav-bg": "rgba(12, 12, 13, 0.04)",
    "--ops-dash-empty-bg": "rgba(255, 210, 31, 0.08)",
    "--ops-dash-empty-border": "rgba(12, 12, 13, 0.2)",
    "--ops-head-ink": "#0c0c0d",
    "--ops-head-muted": "#494b52",
    "--ops-crm-ink": "#0c0c0d",
    "--ops-crm-muted": "#494b52",
    ...opsChartVars(["#ffd21f", "#0c0c0d", "#2c2e33", "#494b52", "#f2bf00"], "#0c0c0d", "#ffd21f", "rgba(255, 210, 31, 0.22)"),
  },
  retail: {
    "--ops-shell-bg": "linear-gradient(180deg, #ffffff 0%, #f4f5f8 100%)",
    "--ops-shell-border": "1px solid #e1e4ea",
    "--ops-shell-shadow": "0 24px 56px rgba(20, 23, 31, 0.08)",
    "--ops-kicker": "#5b6270",
    "--ops-tab-bar-bg": "#eef0f4",
    "--ops-tab-text": "#5b6270",
    "--ops-tab-hover-bg": "rgba(28, 78, 216, 0.08)",
    "--ops-tab-hover-text": "#14171f",
    "--ops-tab-active-bg": "#1c4ed8",
    "--ops-tab-active-text": "#ffffff",
    "--ops-accent": "#1c4ed8",
    "--ops-accent-ink": "#ffffff",
    "--ops-accent-soft": "rgba(28, 78, 216, 0.12)",
    "--ops-chat-bg": "#14171f",
    "--ops-chat-bg-mid": "#1e2433",
    "--ops-chat-bg-end": "#163ba6",
    "--ops-chat-border": "rgba(255, 255, 255, 0.1)",
    "--ops-chat-text": "#ffffff",
    "--ops-chat-muted": "rgba(255, 255, 255, 0.72)",
    "--ops-bubble-bot-bg": "#ffffff",
    "--ops-bubble-bot-text": "#14171f",
    "--ops-bubble-user-bg": "#1c4ed8",
    "--ops-bubble-user-text": "#ffffff",
    "--ops-chip-bg": "rgba(255, 255, 255, 0.1)",
    "--ops-chip-border": "rgba(255, 255, 255, 0.22)",
    "--ops-composer-bg": "#ffffff",
    "--ops-composer-border": "#e1e4ea",
    "--ops-composer-text": "#14171f",
    "--ops-mic-bg": "rgba(28, 78, 216, 0.08)",
    "--ops-mic-icon": "#1c4ed8",
    "--ops-mic-hover-bg": "rgba(28, 78, 216, 0.16)",
    "--ops-mic-hover-icon": "#163ba6",
    "--ops-mic-on-bg": "#1c4ed8",
    "--ops-mic-on-icon": "#ffffff",
    "--ops-quota-track-border": "rgba(28, 78, 216, 0.35)",
    "--ops-quota-value": "#14171f",
    "--ops-focus-ring": "rgba(28, 78, 216, 0.45)",
    "--ops-crm-active-border": "rgba(28, 78, 216, 0.4)",
    "--ops-crm-nav-bg": "rgba(28, 78, 216, 0.04)",
    "--ops-dash-empty-bg": "rgba(28, 78, 216, 0.06)",
    "--ops-dash-empty-border": "rgba(28, 78, 216, 0.2)",
    "--ops-head-ink": "#14171f",
    "--ops-head-muted": "#5b6270",
    "--ops-crm-ink": "#14171f",
    "--ops-crm-muted": "#5b6270",
    ...opsChartVars(["#1c4ed8", "#14171f", "#163ba6", "#5b6270", "#3b82f6"], "#14171f", "#1c4ed8", "rgba(28, 78, 216, 0.12)"),
  },
  gastronomia: {
    "--ops-shell-bg": "linear-gradient(180deg, #f4f1e8 0%, #e5efe6 100%)",
    "--ops-shell-border": "1px solid rgba(20, 49, 40, 0.12)",
    "--ops-shell-shadow": "0 28px 64px rgba(14, 36, 28, 0.1)",
    "--ops-kicker": "#5c6d64",
    "--ops-tab-bar-bg": "rgba(20, 49, 40, 0.06)",
    "--ops-tab-text": "#3c5147",
    "--ops-tab-hover-bg": "rgba(47, 107, 79, 0.12)",
    "--ops-tab-hover-text": "#143128",
    "--ops-tab-active-bg": "#143128",
    "--ops-tab-active-text": "#f4f1e8",
    "--ops-accent": "#2f6b4f",
    "--ops-accent-ink": "#f4f1e8",
    "--ops-accent-soft": "rgba(47, 107, 79, 0.14)",
    "--ops-chat-bg": "#0e241c",
    "--ops-chat-bg-mid": "#143128",
    "--ops-chat-bg-end": "#2f6b4f",
    "--ops-chat-border": "rgba(255, 255, 255, 0.1)",
    "--ops-chat-text": "#f4f1e8",
    "--ops-chat-muted": "rgba(244, 241, 232, 0.75)",
    "--ops-bubble-bot-bg": "rgba(244, 241, 232, 0.97)",
    "--ops-bubble-bot-text": "#143128",
    "--ops-bubble-user-bg": "#2f6b4f",
    "--ops-bubble-user-text": "#f4f1e8",
    "--ops-chip-bg": "rgba(255, 255, 255, 0.1)",
    "--ops-chip-border": "rgba(244, 241, 232, 0.28)",
    "--ops-composer-bg": "#ffffff",
    "--ops-composer-border": "rgba(20, 49, 40, 0.14)",
    "--ops-composer-text": "#143128",
    "--ops-mic-bg": "rgba(47, 107, 79, 0.1)",
    "--ops-mic-icon": "#2f6b4f",
    "--ops-mic-hover-bg": "rgba(47, 107, 79, 0.18)",
    "--ops-mic-hover-icon": "#143128",
    "--ops-mic-on-bg": "#2f6b4f",
    "--ops-mic-on-icon": "#f4f1e8",
    "--ops-quota-track-border": "rgba(47, 107, 79, 0.35)",
    "--ops-quota-value": "#143128",
    "--ops-focus-ring": "rgba(47, 107, 79, 0.45)",
    "--ops-crm-active-border": "rgba(47, 107, 79, 0.4)",
    "--ops-crm-nav-bg": "rgba(20, 49, 40, 0.04)",
    "--ops-dash-empty-bg": "rgba(47, 107, 79, 0.08)",
    "--ops-dash-empty-border": "rgba(20, 49, 40, 0.18)",
    "--ops-head-ink": "#143128",
    "--ops-head-muted": "#5c6d64",
    "--ops-crm-ink": "#143128",
    "--ops-crm-muted": "#5c6d64",
    ...opsChartVars(["#2f6b4f", "#143128", "#0e241c", "#5c6d64", "#b8954a"], "#143128", "#2f6b4f", "rgba(47, 107, 79, 0.14)"),
  },
  servicios: {
    "--ops-shell-bg": "linear-gradient(180deg, #ffffff 0%, #f6f3ee 100%)",
    "--ops-shell-border": "1px solid #e4ddd4",
    "--ops-shell-shadow": "0 24px 60px rgba(17, 17, 17, 0.08)",
    "--ops-kicker": "#5e5a55",
    "--ops-tab-bar-bg": "#ece7e2",
    "--ops-tab-text": "#5e5a55",
    "--ops-tab-hover-bg": "rgba(17, 17, 17, 0.06)",
    "--ops-tab-hover-text": "#111111",
    "--ops-tab-active-bg": "#111111",
    "--ops-tab-active-text": "#ffffff",
    "--ops-accent": "#111111",
    "--ops-accent-ink": "#ffffff",
    "--ops-accent-soft": "rgba(17, 17, 17, 0.1)",
    "--ops-chat-bg": "#111111",
    "--ops-chat-bg-mid": "#1a1a1a",
    "--ops-chat-bg-end": "#3a3a3a",
    "--ops-chat-border": "rgba(255, 255, 255, 0.1)",
    "--ops-chat-text": "#f6f3ee",
    "--ops-chat-muted": "rgba(246, 243, 238, 0.72)",
    "--ops-bubble-bot-bg": "#ffffff",
    "--ops-bubble-bot-text": "#111111",
    "--ops-bubble-user-bg": "#111111",
    "--ops-bubble-user-text": "#ffffff",
    "--ops-chip-bg": "rgba(255, 255, 255, 0.08)",
    "--ops-chip-border": "rgba(255, 255, 255, 0.2)",
    "--ops-composer-bg": "#ffffff",
    "--ops-composer-border": "#e4ddd4",
    "--ops-composer-text": "#111111",
    "--ops-mic-bg": "rgba(17, 17, 17, 0.06)",
    "--ops-mic-icon": "#111111",
    "--ops-mic-hover-bg": "rgba(17, 17, 17, 0.12)",
    "--ops-mic-hover-icon": "#111111",
    "--ops-mic-on-bg": "#111111",
    "--ops-mic-on-icon": "#ffffff",
    "--ops-quota-track-border": "rgba(17, 17, 17, 0.25)",
    "--ops-quota-value": "#111111",
    "--ops-focus-ring": "rgba(17, 17, 17, 0.35)",
    "--ops-crm-active-border": "rgba(17, 17, 17, 0.35)",
    "--ops-crm-nav-bg": "rgba(17, 17, 17, 0.04)",
    "--ops-dash-empty-bg": "rgba(17, 17, 17, 0.05)",
    "--ops-dash-empty-border": "rgba(17, 17, 17, 0.16)",
    "--ops-head-ink": "#111111",
    "--ops-head-muted": "#5e5a55",
    "--ops-crm-ink": "#111111",
    "--ops-crm-muted": "#5e5a55",
    ...opsChartVars(["#111111", "#3a3a3a", "#5e5a55", "#888680", "#2a2a2a"], "#111111", "#111111", "rgba(17, 17, 17, 0.1)"),
  },
  agroindustria: {
    "--ops-shell-bg": "linear-gradient(180deg, #fbfaf5 0%, #f5f2e8 100%)",
    "--ops-shell-border": "1px solid rgba(15, 26, 19, 0.14)",
    "--ops-shell-shadow": "0 28px 64px rgba(12, 35, 24, 0.1)",
    "--ops-kicker": "#55645a",
    "--ops-tab-bar-bg": "rgba(12, 35, 24, 0.06)",
    "--ops-tab-text": "#55645a",
    "--ops-tab-hover-bg": "rgba(185, 224, 91, 0.2)",
    "--ops-tab-hover-text": "#0c2318",
    "--ops-tab-active-bg": "#0c2318",
    "--ops-tab-active-text": "#dff0a8",
    "--ops-accent": "#b9e05b",
    "--ops-accent-ink": "#0c2318",
    "--ops-accent-soft": "rgba(185, 224, 91, 0.25)",
    "--ops-chat-bg": "#0c2318",
    "--ops-chat-bg-mid": "#123222",
    "--ops-chat-bg-end": "#1d4a30",
    "--ops-chat-border": "rgba(255, 255, 255, 0.1)",
    "--ops-chat-text": "#f5f2e8",
    "--ops-chat-muted": "rgba(245, 242, 232, 0.75)",
    "--ops-bubble-bot-bg": "#fbfaf5",
    "--ops-bubble-bot-text": "#0f1a13",
    "--ops-bubble-user-bg": "#b9e05b",
    "--ops-bubble-user-text": "#0c2318",
    "--ops-chip-bg": "rgba(255, 255, 255, 0.08)",
    "--ops-chip-border": "rgba(185, 224, 91, 0.35)",
    "--ops-composer-bg": "#ffffff",
    "--ops-composer-border": "rgba(15, 26, 19, 0.12)",
    "--ops-composer-text": "#0f1a13",
    "--ops-mic-bg": "rgba(185, 224, 91, 0.15)",
    "--ops-mic-icon": "#1d4a30",
    "--ops-mic-hover-bg": "rgba(185, 224, 91, 0.28)",
    "--ops-mic-hover-icon": "#0c2318",
    "--ops-mic-on-bg": "#b9e05b",
    "--ops-mic-on-icon": "#0c2318",
    "--ops-quota-track-border": "rgba(29, 74, 48, 0.35)",
    "--ops-quota-value": "#0f1a13",
    "--ops-focus-ring": "rgba(185, 224, 91, 0.55)",
    "--ops-crm-active-border": "rgba(185, 224, 91, 0.45)",
    "--ops-crm-nav-bg": "rgba(12, 35, 24, 0.04)",
    "--ops-dash-empty-bg": "rgba(185, 224, 91, 0.1)",
    "--ops-dash-empty-border": "rgba(12, 35, 24, 0.18)",
    "--ops-head-ink": "#0f1a13",
    "--ops-head-muted": "#55645a",
    "--ops-crm-ink": "#0f1a13",
    "--ops-crm-muted": "#55645a",
    ...opsChartVars(["#b9e05b", "#0c2318", "#1d4a30", "#55645a", "#123222"], "#0f1a13", "#b9e05b", "rgba(185, 224, 91, 0.25)"),
  },
};

export function operationsThemeVars(templateId: TemplateId): CSSProperties {
  return THEMES[templateId] as CSSProperties;
}

export function operationsThemeFor(templateId: TemplateId): OperationsThemeVars {
  return THEMES[templateId];
}

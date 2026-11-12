// Plain module (no "use client") so the server page can validate ?tab= values.
export const SETTINGS_TAB_IDS = ["profile", "account", "preferences", "appearance", "security", "data", "danger"] as const;
export type SettingsTab = (typeof SETTINGS_TAB_IDS)[number];

export function parseSettingsTab(value: unknown): SettingsTab {
  return SETTINGS_TAB_IDS.includes(value as SettingsTab) ? (value as SettingsTab) : "profile";
}

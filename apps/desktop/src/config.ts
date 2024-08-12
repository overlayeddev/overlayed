export type DirectionLR = "left" | "right" | "center";
export type DirectionTB = "top" | "bottom";

export interface OverlayedConfig {
  pin: boolean;
  horizontal: DirectionLR;
  vertical: DirectionTB;
  telemetry: boolean;
  joinHistoryNotifications: boolean;
  showOnlyTalkingUsers: boolean;
  showOwnUser: boolean;
}

export type OverlayedConfigKey = keyof OverlayedConfig;

export const DEFAULT_OVERLAYED_CONFIG: OverlayedConfig = {
  pin: false,
  horizontal: "right",
  // TODO: vertical alignment? i.e., if aligned to bottom, then the navbar should be at the bottom (and corner radius changes appropriately)
  vertical: "bottom",
  telemetry: true,
  joinHistoryNotifications: false,
  showOnlyTalkingUsers: false,
  showOwnUser: true,
};

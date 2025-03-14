import { axiom } from "@/axiom";
import Config from "@/config";

export const OVERLAYED_DATASET = "overlayed-prod";

/** The name of the metric to track. */
export const Metric = {
  /** If the auth to discord was successful or not */
  DiscordAuthed: "discord-auth",
  /** Track user login and limited metadata */
  DiscordUser: "discord-user",
  /** Track user joins a channel */
  ChannelJoin: "channel-join",
  /** Track when user pins overlayed */
  Pin: "pin",
} as const;

type MetricNamesValues = (typeof Metric)[keyof typeof Metric];

// NOTE: allow opt-out of tracking from the settings UI
const isTelemetryEnabled = () => {
  return import.meta.env.VITE_AXIOM_TOKEN && Config.get("telemetry");
};

// TODO: fix this with the config update, top level await is no longer allowed for older targets :(
// tell the user if they have telemetry disabled
// if (!(await Config.get("telemetry"))) {
//   console.warn("[TELEMETRY] Disabling axiom telemetry because the user has disabled it");
// } else {
//   console.log("[TELEMETRY] Axiom telemetry is enabled!");
// }

/** Will track metric was successful or not. */
export const track = (name: MetricNamesValues, status: number) => {
  if (!isTelemetryEnabled()) return;

  axiom.ingest(OVERLAYED_DATASET, [
    {
      event: name,
      status,
    },
  ]);
};

/** Will track metric was successful or not. */
export const trackEvent = (name: MetricNamesValues, payload: unknown) => {
  if (!isTelemetryEnabled()) return;

  axiom.ingest(OVERLAYED_DATASET, [
    {
      event: name,
      payload,
    },
  ]);
};

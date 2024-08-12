import { axiom } from "@/axiom";
import { Store } from "tauri-plugin-store-api";

const store = new Store("config.json");

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
const isTelemetryEnabled = async () => {
  return import.meta.env.VITE_AXIOM_TOKEN && (await store.get<{ value: boolean }>("telemetry"))?.value;
};

// tell the user if they have telemetry disabled
if (!(await store.get<{ value: boolean }>("telemetry"))?.value) {
  console.warn("[TELEMETRY] Disabling axiom telemetry because the user has disabled it");
} else {
  console.log("[TELEMETRY] Axiom telemetry is enabled!");
}

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

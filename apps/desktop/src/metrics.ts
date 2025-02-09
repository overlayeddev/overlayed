import { axiom } from "@/axiom";
import { settings } from "@/App";
import * as Sentry from "@sentry/react";

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

const isTelemetryEnabled = async () => {
  const telemetryEnabled = await settings.get("telemetry");
  const hasTelemetryToken = import.meta.env.VITE_AXIOM_TOKEN;

  if (!(telemetryEnabled && hasTelemetryToken)) {
    console.warn("[TELEMETRY] Disabling axiom telemetry because the user has disabled it");
    console.warn("[TELEMETRY] Disabling sentry.io telemetry because the user has disabled it");
    Sentry.close();
  } else {
    console.log("[TELEMETRY] Axiom telemetry is enabled!");
    console.log("[TELEMETRY] sentry.io telemetry is enabled!");
  }

  return telemetryEnabled && hasTelemetryToken;
};

/** Will track metric was successful or not. */
export const track = async (name: MetricNamesValues, status: number) => {
  if (!(await isTelemetryEnabled())) return;

  axiom.ingest(OVERLAYED_DATASET, [
    {
      event: name,
      status,
    },
  ]);
};

/** Will track metric was successful or not. */
export const trackEvent = async (name: MetricNamesValues, payload: unknown) => {
  if (!(await isTelemetryEnabled())) return;

  axiom.ingest(OVERLAYED_DATASET, [
    {
      event: name,
      payload,
    },
  ]);
};

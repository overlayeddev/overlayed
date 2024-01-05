import { axiom } from "@/axiom";

export const OVERLAYED_DATASET = "overlayed-prod";

/** The name of the metric to track. */
export const MetricNames = {
  /** If the auth to discord was successful. */
  DiscordAuthed: "discord-auth",
  /** Track user login. */
  DiscordUser: "discord-user",
} as const;

type MetricNamesValues = (typeof MetricNames)[keyof typeof MetricNames];

/** Will track metric was successful or not. */
export const track = (name: MetricNamesValues, status: number) => {
  axiom.ingest(OVERLAYED_DATASET, [
    {
      event: name,
      status,
    },
  ]);
};

/** Will track metric was successful or not. */
export const trackEvent = (name: MetricNamesValues, payload: unknown) => {
  axiom.ingest(OVERLAYED_DATASET, [
    {
      event: name,
      payload,
    },
  ]);
};

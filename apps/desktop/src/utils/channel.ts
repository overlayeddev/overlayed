import { CHANNEL_TYPES } from "@/constants";
import type { CurrentChannel } from "@/types";

export const getChannelName = (channel: CurrentChannel | null) => {
  if (!channel) return undefined;
  return channel.type === CHANNEL_TYPES.DM || channel.type === CHANNEL_TYPES.GROUP_DM ? "Private call" : channel.name;
};

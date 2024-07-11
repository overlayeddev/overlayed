export const Event = {
  UserLogUpdate: "user-log-update",
} as const;

/**
 * discrod wrorete a bad api dog, we got voice AND TEXT CHANNELS?
 *
 * {@link https://discord.com/developers/docs/resources/channel#channel-object-channel-types}
 */
export const CHANNEL_TYPES = {
  GUILD_TEXT: 0,
  DM: 1,
  GUILD_VOICE: 2,
  GROUP_DM: 3,
  GUILD_CATEGORY: 4,
  GUILD_ANNOUNCEMENT: 5,
  ANNOUNCEMENT_THREAD: 10,
  PUBLIC_THREAD: 11,
  PRIVATE_THREAD: 12,
  GUILD_STAGE_VOICE: 13,
  GUILD_DIRECTORY: 14,
  GUILD_FORUM: 15,
  GUILD_MEDIA: 16,
} as const;

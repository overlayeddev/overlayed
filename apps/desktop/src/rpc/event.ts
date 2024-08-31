export enum RPCEvent {
  /** non-subscription event sent immediately after connecting, contains server information */
  READY = "READY",
  /** non-subscription event sent when there is an error, including command responses */
  ERROR = "ERROR",
  /** sent when a user in a subscribed voice channel speaks */
  SPEAKING_START = "SPEAKING_START",
  /** sent when a user in a subscribed voice channel stops speaking */
  SPEAKING_STOP = "SPEAKING_STOP",
  /**	sent when a user joins a subscribed voice channel */
  VOICE_STATE_CREATE = "VOICE_STATE_CREATE",
  /** sent when a user joins a subscribed voice channel */
  VOICE_STATE_DELETE = "VOICE_STATE_DELETE",
  /** sent when a user's voice state changes in a subscribed voice channel (mute, volume, etc.) */
  VOICE_STATE_UPDATE = "VOICE_STATE_UPDATE",
  /** sent when the client joins a voice channel */
  VOICE_CHANNEL_SELECT = "VOICE_CHANNEL_SELECT",
  /** sent when the client's voice connection status changes */
  VOICE_CONNECTION_STATUS = "VOICE_CONNECTION_STATUS",
  /** not quite sure */
  VIDEO_STATE_UPDATE = "VIDEO_STATE_UPDATE",
  /** not quite sure */
  SCREENSHARE_STATE_UPDATE = "SCREENSHARE_STATE_UPDATE",
  /** sent when the you get a message that tags your or a dm */
  NOTIFICATION_CREATE = "NOTIFICATION_CREATE",
}

// TODO: move this somewhere
export enum ChannelTypes {
  DM = 1,
  GROUP_DM = 3,
  GUILD_TEXT = 0,
  GUILD_VOICE = 2,
}
